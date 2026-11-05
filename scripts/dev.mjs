// `pnpm dev`: the functions watcher, every Firebase emulator as demo-splitify, and `next dev` on 2140.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureFunctionsSecret, webDevEnv } from "./dev-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const functionsDir = path.join(root, "functions");

if (!existsSync(path.join(functionsDir, "node_modules"))) {
  console.error("Run pnpm functions:install first");
  process.exit(1);
}

if (ensureFunctionsSecret(functionsDir) === "created") {
  console.log(
    "[dev] wrote functions/.secret.local with a new SESSION_PASSWORD",
  );
}

// The Functions emulator loads functions/lib, so it has to exist before the emulators start.
const build = spawnSync("pnpm", ["functions:build"], {
  cwd: root,
  stdio: "inherit",
});
if (build.status !== 0) {
  console.error("[dev] pnpm functions:build failed");
  process.exit(build.status ?? 1);
}

const children = [];
let stopping = false;
let exitCode = 0;

/** Starts a child in its own process group, with each output line prefixed by its name. */
function start(name, command, args, { cwd = root, env = process.env } = {}) {
  const child = spawn(command, args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  for (const [stream, out] of [
    [child.stdout, process.stdout],
    [child.stderr, process.stderr],
  ]) {
    let pending = "";
    stream.on("data", (chunk) => {
      const lines = (pending + chunk).split("\n");
      pending = lines.pop();
      for (const line of lines) out.write(`[${name}] ${line}\n`);
    });
    stream.on("end", () => {
      if (pending) out.write(`[${name}] ${pending}\n`);
    });
  }
  child.on("error", (error) => {
    console.error(`[dev] could not start ${name}: ${error.message}`);
    exitCode = 1;
    stop();
  });
  child.on("exit", (code, signal) => {
    child.done = true;
    if (!stopping) {
      console.error(
        `[dev] ${name} exited (${signal ?? code}); stopping the rest`,
      );
      exitCode = code ?? 1;
    }
    stop();
  });
  children.push(child);
  return child;
}

/** Signals each running child's own process; `group` signals its whole process group instead. */
function signalAll(signal, { group = false } = {}) {
  for (const child of children) {
    if (child.done || !child.pid) continue;
    try {
      process.kill(group ? -child.pid : child.pid, signal);
    } catch {
      // Already gone.
    }
  }
}

function stop() {
  if (stopping) {
    if (children.every((child) => child.done)) process.exit(exitCode);
    return;
  }
  stopping = true;
  // SIGINT goes to each command alone, not its whole group: the emulators then stop their own helpers in order and
  // export their data to .emulator-data (a SIGINT to the SQL Connect helper itself closes its database before the export).
  signalAll("SIGINT");
  setTimeout(() => {
    console.error("[dev] children did not stop in 60 s; killing them");
    signalAll("SIGKILL", { group: true });
    process.exit(exitCode || 1);
  }, 60_000).unref();
  if (children.every((child) => child.done)) process.exit(exitCode);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

start("functions", "pnpm", [
  "--dir",
  "functions",
  "exec",
  "tsc",
  "--watch",
  "--preserveWatchOutput",
]);
start("emulators", "pnpm", ["emulators"]);
start("web", "pnpm", ["dev:web"], { env: { ...process.env, ...webDevEnv() } });
