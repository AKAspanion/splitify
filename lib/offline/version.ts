type SwManifest = { version?: unknown };

/**
 * The service worker's version, read from the global that `/sw-manifest.js` sets (`__SPLITIFY_SW_MANIFEST__`),
 * "dev" before one exists. The saved cache is thrown away when it changes.
 */
export function appVersion(): string {
  const manifest = (globalThis as { __SPLITIFY_SW_MANIFEST__?: SwManifest })
    .__SPLITIFY_SW_MANIFEST__;
  return typeof manifest?.version === "string" ? manifest.version : "dev";
}
