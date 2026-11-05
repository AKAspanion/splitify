import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

/** The env `next dev` gets so the browser talks to the emulators as demo-splitify. */
export function webDevEnv() {
  return {
    NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-splitify",
    NEXT_PUBLIC_FIREBASE_API_KEY: "demo-key",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-splitify.firebaseapp.com",
  };
}

/** Dev-only rewrites from /api/<fn>/** to the Functions emulator, mirroring firebase.json's hosting rewrites. */
export function functionRewrites(firebaseJson, projectId) {
  const { host = "127.0.0.1", port } = firebaseJson.emulators?.functions ?? {};
  const rewrites = firebaseJson.hosting?.rewrites ?? [];
  return rewrites
    .filter(
      (rewrite) =>
        rewrite.function && /^\/api\/[^/]+\/\*\*$/.test(rewrite.source),
    )
    .map((rewrite) => {
      const { functionId, region } = rewrite.function;
      const prefix = rewrite.source.slice(0, -"/**".length);
      return {
        source: `${prefix}/:path*`,
        // The emulator's path after the function name becomes the request path, so the function sees /api/<fn>/...
        destination: `http://${host}:${port}/${projectId}/${region}/${functionId}${prefix}/:path*`,
      };
    });
}

/** Writes functions/.secret.local with a random 48-character SESSION_PASSWORD when the file is missing; never overwrites it. */
export function ensureFunctionsSecret(functionsDir) {
  const file = path.join(functionsDir, ".secret.local");
  if (existsSync(file)) return "kept";
  // 36 random bytes -> 48 base64url characters.
  const password = randomBytes(36).toString("base64url");
  writeFileSync(file, `SESSION_PASSWORD=${password}\n`, {
    mode: 0o600,
    flag: "wx",
  });
  return "created";
}
