// `pnpm dev`: the functions watcher, every Firebase emulator as demo-splitify, and `next dev` on 2140.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

const bin = (dir, name) => path.join(dir, "node_modules", ".bin", name);
const tsc = bin(functionsDir, "tsc");

// The Functions emulator loads functions/lib, so it has to exist before the emulators start.
const build = spawnSync(tsc, [], { cwd: functionsDir, stdio: "inherit" });
if (build.status !== 0) {
  console.error("[dev] building the functions failed");
  process.exit(build.status ?? 1);
}

// The emulators and the web server run from package.json's `emulators` and `dev:web` scripts, so `pnpm emulators`,
// `pnpm dev:web` and `pnpm dev` cannot drift; dev.mjs spawns each program with that script's arguments, with no pnpm
// or shell between it and firebase-tools or next.
const scripts = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf8"),
).scripts;
function scriptArgs(script, program) {
  if (!scripts[script]?.startsWith(`${program} `)) {
    console.error(
      `[dev] package.json's "${script}" script must run ${program}`,
    );
    process.exit(1);
  }
  return scripts[script].split(/\s+/).slice(1);
}

// How long each child gets to exit after its SIGINT before its process group is killed. The emulators export their
// data on the way out.
const EMULATORS_GRACE_MS = 120_000;
const GRACE_MS = 15_000;

const children = [];
let stopping = false;
let failed = false;
let signals = 0;

const log = (line) => console.error(`[dev] ${line}`);

/** Starts a child in its own process group, with each output line prefixed by its name. */
function start(
  name,
  command,
  args,
  { cwd = root, env = process.env, graceMs = GRACE_MS } = {},
) {
  const child = {
    name,
    graceMs,
    exited: false,
    sentSigint: false,
    closed: undefined,
    proc: spawn(command, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      // Its own group: a Ctrl+C in the terminal reaches dev.mjs alone, and dev.mjs decides how each child stops.
      detached: true,
    }),
  };
  const proc = child.proc;
  for (const [stream, out] of [
    [proc.stdout, process.stdout],
    [proc.stderr, process.stderr],
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
  // Resolves once the child's output is flushed, or half a second after it exits when a helper still holds the pipes.
  child.closed = new Promise((resolve) => {
    proc.on("close", resolve);
    proc.on("exit", () => setTimeout(resolve, 500).unref());
    proc.on("error", resolve);
  });
  proc.on("error", (error) => {
    log(`could not start ${name}: ${error.message}`);
    child.exited = true;
    failed = true;
    stop();
  });
  proc.on("exit", (code, signal) => {
    child.exited = true;
    if (!stopping) {
      log(`${name} exited (${signal ?? code}) on its own; stopping the rest`);
      failed = true;
    } else if (!(code === 0 || (signal === "SIGINT" && child.sentSigint))) {
      log(`${name} did not stop cleanly (${signal ?? code})`);
      failed = true;
    }
    stop();
  });
  children.push(child);
  return child;
}

/** Sends one signal to a running child's process group. */
function signalGroup(child, signal) {
  if (child.exited || !child.proc.pid) return;
  try {
    process.kill(-child.proc.pid, signal);
  } catch {
    // Already gone.
  }
}

/** Sends one signal to the child's own process, not its group. */
function signalChild(child, signal) {
  if (child.exited || !child.proc.pid) return;
  try {
    process.kill(child.proc.pid, signal);
  } catch {
    // Already gone.
  }
}

/** The first call starts the shutdown: one SIGINT per child, a SIGKILL for any still running after its grace. */
function stop() {
  if (!stopping) {
    stopping = true;
    // SIGINT goes to each command's own process, which stops its helpers in order and exports the emulators' data.
    for (const child of children) {
      child.sentSigint = true;
      signalChild(child, "SIGINT");
      setTimeout(() => {
        if (child.exited) return;
        log(
          `${child.name} did not stop in ${child.graceMs / 1000} s; killing it`,
        );
        failed = true;
        signalGroup(child, "SIGKILL");
      }, child.graceMs).unref();
    }
  }
  // Exit only once every child has exited and its output is flushed.
  if (children.every((child) => child.exited)) {
    Promise.all(children.map((child) => child.closed)).then(() =>
      process.exit(failed ? 1 : 0),
    );
  }
}

/** The first SIGINT or SIGTERM starts the shutdown; a second skips the wait and kills what is still running. */
function onSignal(signal) {
  signals++;
  if (signals === 1) {
    log(`${signal}: stopping; the emulators export their data first`);
    stop();
  } else if (signals === 2) {
    log(`${signal} again: killing everything now`);
    failed = true;
    for (const child of children) signalGroup(child, "SIGKILL");
  }
}

process.on("SIGINT", () => onSignal("SIGINT"));
process.on("SIGTERM", () => onSignal("SIGTERM"));

start("functions", tsc, ["--watch", "--preserveWatchOutput"], {
  cwd: functionsDir,
});
start("emulators", bin(root, "firebase"), scriptArgs("emulators", "firebase"), {
  graceMs: EMULATORS_GRACE_MS,
});
start("web", bin(root, "next"), scriptArgs("dev:web", "next"), {
  env: { ...process.env, ...webDevEnv() },
});
