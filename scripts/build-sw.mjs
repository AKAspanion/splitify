// Stub: writes an empty service-worker manifest so the build has one. The service worker task replaces it.
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("out", { recursive: true });
writeFileSync(
  "out/sw-manifest.js",
  `self.__SPLITIFY_SW_MANIFEST__ = ${JSON.stringify({ version: "dev", files: [] })};\n`,
);
