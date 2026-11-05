import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { rulesTestConfig } from "./rules-test-firebase-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const firebaseJson = JSON.parse(
  readFileSync(path.join(root, "firebase.json"), "utf8"),
);

const portsOf = (emulators) =>
  Object.values(emulators)
    .filter((block) => typeof block === "object")
    .flatMap((block) => [block.port, block.postgresPort])
    .filter((port) => port !== undefined);

describe("rulesTestConfig", () => {
  const config = rulesTestConfig(firebaseJson);

  it("gives the rule tests ports 2152 to 2156, each once, on 127.0.0.1", () => {
    expect(portsOf(config.emulators).sort()).toEqual([
      2152, 2153, 2154, 2155, 2156,
    ]);
    for (const block of Object.values(config.emulators)) {
      if (typeof block === "object" && block.enabled !== false) {
        expect(block.host).toBe("127.0.0.1");
      }
    }
  });

  it("shares no port with the dev emulators in firebase.json", () => {
    const dev = new Set(portsOf(firebaseJson.emulators));
    for (const port of portsOf(config.emulators)) {
      expect(dev.has(port)).toBe(false);
    }
  });

  it("disables the Emulator UI and keeps the rest of firebase.json", () => {
    expect(config.emulators.ui).toEqual({ enabled: false });
    expect(config.dataconnect).toEqual(firebaseJson.dataconnect);
    expect(config.functions).toEqual(firebaseJson.functions);
    expect(config.hosting).toEqual(firebaseJson.hosting);
  });
});
