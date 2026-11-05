// Writes firebase.rules-test.json: firebase.json with the emulators moved to 2152 to 2156, so `pnpm test:rules` runs its
// own Auth and SQL Connect emulators beside `pnpm dev` without touching the dev emulators' ports or data.
// Used with `--config firebase.rules-test.json` by `pnpm test:rules`. Never deploy with it.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HOST = "127.0.0.1";

/** firebase.json with only the emulators block replaced: the ports the rule tests use, and no Emulator UI. */
export function rulesTestConfig(firebaseJson) {
  return {
    ...firebaseJson,
    emulators: {
      singleProjectMode: true,
      hub: { host: HOST, port: 2152 },
      auth: { host: HOST, port: 2153 },
      dataconnect: { host: HOST, port: 2154, postgresPort: 2155 },
      ui: { enabled: false },
      logging: { host: HOST, port: 2156 },
    },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(process.argv[1]), "..");
  const config = rulesTestConfig(
    JSON.parse(readFileSync(path.join(root, "firebase.json"), "utf8")),
  );
  writeFileSync(
    path.join(root, "firebase.rules-test.json"),
    JSON.stringify(config, null, 2) + "\n",
  );
  console.log("Wrote firebase.rules-test.json");
}
