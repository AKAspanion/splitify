// Writes firebase.emulators.json: firebase.json with the emulators' addresses added to the hosting CSP's connect-src,
// so the app served by the Hosting emulator may call the Auth, SQL Connect and Functions emulators, and the Auth
// emulator's added to its frame-src, where Firebase Auth frames its /__/auth/iframe. Generated from firebase.json so
// the two cannot drift. Used with `--config firebase.emulators.json` by `pnpm check:hosting` and browser checks.
// Never deploy with it.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const config = JSON.parse(
  readFileSync(path.join(root, "firebase.json"), "utf8"),
);
/** One emulator's origin, as read from firebase.json's emulators block. */
function emulatorOrigin(name) {
  const { host, port } = config.emulators?.[name] ?? {};
  if (!host || !port)
    throw new Error(`firebase.json's emulators.${name} needs a host and port`);
  return `http://${host}:${port}`;
}

/** Adds `sources` right after `<directive> 'self'`, which firebase.json's CSP must have. */
function addSources(csp, directive, sources) {
  const anchor = `${directive} 'self'`;
  if (!csp.includes(anchor))
    throw new Error(`firebase.json's CSP has no ${anchor}`);
  return csp.replace(anchor, `${anchor} ${sources}`);
}

const EMULATORS = ["auth", "dataconnect", "functions"]
  .map(emulatorOrigin)
  .join(" ");
let changed = 0;
for (const block of config.hosting.headers) {
  for (const header of block.headers) {
    if (header.key !== "Content-Security-Policy") continue;
    header.value = addSources(header.value, "connect-src", EMULATORS);
    header.value = addSources(
      header.value,
      "frame-src",
      emulatorOrigin("auth"),
    );
    changed++;
  }
}
if (changed === 0)
  throw new Error("firebase.json has no Content-Security-Policy header");
writeFileSync(
  path.join(root, "firebase.emulators.json"),
  JSON.stringify(config, null, 2) + "\n",
);
console.log("Wrote firebase.emulators.json");
