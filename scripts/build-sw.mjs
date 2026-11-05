// Runs after `next build` (`postbuild`): copies the worker's routing next to it and writes `out/sw-manifest.js`, the
// list of every file the export holds (but the worker and the manifest) and a version that changes when any of them
// does. The worker precaches the list, and the page reads the version (`lib/offline/version.ts`).
import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NOT_PRECACHED = new Set(["sw.js", "sw-manifest.js"]);

function listFiles(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory()
      ? listFiles(full, base)
      : [path.relative(base, full).split(path.sep).join("/")];
  });
}

/** Writes `<outDir>/sw-manifest.js` for the files in `outDir`; returns the manifest. */
export function writeManifest(outDir) {
  const files = listFiles(outDir)
    .filter((file) => !NOT_PRECACHED.has(file))
    .sort();
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file).update("\0");
    hash.update(readFileSync(path.join(outDir, file))).update("\0");
  }
  const manifest = { version: hash.digest("hex").slice(0, 16), files };
  writeFileSync(
    path.join(outDir, "sw-manifest.js"),
    `self.__SPLITIFY_SW_MANIFEST__ = ${JSON.stringify(manifest)};\n`,
  );
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const outDir = path.join(root, "out");
  mkdirSync(outDir, { recursive: true });
  copyFileSync(
    path.join(root, "lib", "offline", "sw-routing.js"),
    path.join(outDir, "sw-routing.js"),
  );
  const { files } = writeManifest(outDir);
  console.log(`sw-manifest.js: ${files.length} files precached`);
}
