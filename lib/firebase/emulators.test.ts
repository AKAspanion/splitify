import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EMULATOR_HOST, EMULATOR_PORTS } from "./emulators";

const root = path.resolve(__dirname, "../..");
const readJson = (file: string) =>
  JSON.parse(readFileSync(path.join(root, file), "utf8"));
// Each emulator's block; `singleProjectMode` is a flag, not a block.
const emulators: Record<string, Record<string, unknown>> = Object.fromEntries(
  Object.entries(readJson("firebase.json").emulators).filter(
    ([, block]) => typeof block === "object",
  ) as [string, Record<string, unknown>][],
);

describe("the browser's emulator addresses", () => {
  it("equal the ports and hosts in firebase.json", () => {
    expect(EMULATOR_PORTS.auth).toBe(emulators.auth.port);
    expect(EMULATOR_PORTS.dataconnect).toBe(emulators.dataconnect.port);
    expect(EMULATOR_PORTS.functions).toBe(emulators.functions.port);
    for (const name of ["auth", "dataconnect", "functions"]) {
      expect(emulators[name].host).toBe(EMULATOR_HOST);
    }
  });
});

describe("firebase.json's emulators", () => {
  it("use 2141 to 2150, each once, and every block binds 127.0.0.1", () => {
    const ports = Object.values(emulators)
      .flatMap((block) => [block.port, block.postgresPort])
      .filter((port) => port !== undefined);
    expect([...ports].sort()).toEqual(
      Array.from({ length: 10 }, (_, i) => 2141 + i),
    );
    for (const block of Object.values(emulators)) {
      expect(block.host).toBe("127.0.0.1");
    }
  });

  it("leave 2140 to the Next dev server", () => {
    expect(readJson("package.json").scripts["dev:web"]).toContain("-p 2140");
  });
});
