import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { writeManifest } from "./build-sw.mjs";

function fakeOut(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "sw-out-"));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    writeFileSync(path.join(dir, name), content);
  }
  return dir;
}

function manifestOf(dir) {
  const self = {};
  vm.runInNewContext(readFileSync(path.join(dir, "sw-manifest.js"), "utf8"), {
    self,
  });
  return self.__SPLITIFY_SW_MANIFEST__;
}

const files = {
  "index.html": "<html>home</html>",
  "groups/index.html": "<html>groups</html>",
  "_next/static/a.js": "console.log(1)",
};

describe("writeManifest", () => {
  it("lists every file but the worker and the manifest", () => {
    const dir = fakeOut({ ...files, "sw.js": "worker" });
    writeManifest(dir);
    const manifest = manifestOf(dir);
    expect([...manifest.files].sort()).toEqual(
      ["_next/static/a.js", "groups/index.html", "index.html"].sort(),
    );
    expect(manifest.version).toMatch(/^[0-9a-f]{16}$/);
  });

  it("changes the version when one file's content changes, and only then", () => {
    const a = fakeOut(files);
    const b = fakeOut(files);
    const c = fakeOut({ ...files, "_next/static/a.js": "console.log(2)" });
    for (const d of [a, b, c]) writeManifest(d);
    expect(manifestOf(a).version).toBe(manifestOf(b).version);
    expect(manifestOf(c).version).not.toBe(manifestOf(a).version);
  });

  it("does not count its own earlier output or the worker in the version", () => {
    const dir = fakeOut(files);
    writeManifest(dir);
    const first = manifestOf(dir).version;
    writeFileSync(path.join(dir, "sw.js"), "changed worker");
    writeManifest(dir);
    expect(manifestOf(dir).version).toBe(first);
  });
});
