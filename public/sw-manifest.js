// In development, sw-manifest.js provides a default manifest so appVersion() resolves
// and the script loads without a 404. In production builds, postbuild (scripts/build-sw.mjs)
// generates the real manifest in out/sw-manifest.js.
self.__SPLITIFY_SW_MANIFEST__ = { version: "dev", files: [] };

