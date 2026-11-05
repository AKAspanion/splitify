// Writes firebase.emulators.json: firebase.json with the emulators' addresses added to the hosting CSP's connect-src,
// so the app served by the Hosting emulator may call the Auth, SQL Connect and Functions emulators. Generated from
// firebase.json so the two cannot drift. Used with `--config firebase.emulators.json` by `yarn check:hosting` and
// browser checks. Never deploy with it.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const config = JSON.parse(
  readFileSync(path.join(root, "firebase.json"), "utf8"),
);
// The Auth, SQL Connect and Functions emulators, as read from firebase.json's emulators block.
const EMULATORS = ["auth", "dataconnect", "functions"]
  .map((name) => {
    const { host, port } = config.emulators?.[name] ?? {};
    if (!host || !port)
      throw new Error(
        `firebase.json's emulators.${name} needs a host and port`,
      );
    return `http://${host}:${port}`;
  })
  .join(" ");
let changed = 0;
for (const block of config.hosting.headers) {
  for (const header of block.headers) {
    if (header.key !== "Content-Security-Policy") continue;
    if (!header.value.includes("connect-src 'self'"))
      throw new Error("firebase.json's CSP has no connect-src 'self'");
    header.value = header.value.replace(
      "connect-src 'self'",
      `connect-src 'self' ${EMULATORS}`,
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
