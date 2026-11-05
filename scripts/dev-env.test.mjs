import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ensureFunctionsSecret,
  functionRewrites,
  webDevEnv,
} from "./dev-env.mjs";

const firebaseJson = {
  emulators: { functions: { host: "127.0.0.1", port: 2145 } },
  hosting: {
    rewrites: [
      {
        source: "/api/reports/**",
        function: { functionId: "reports", region: "asia-south1" },
      },
      {
        source: "/api/webauthn/**",
        function: { functionId: "webauthn", region: "asia-south1" },
      },
      { source: "/groups/*", destination: "/groups/_/index.html" },
    ],
  },
};

describe("functionRewrites", () => {
  it("sends each function rewrite to the Functions emulator and skips page rewrites", () => {
    expect(functionRewrites(firebaseJson, "demo-splitify")).toEqual([
      {
        source: "/api/reports/:path*",
        destination:
          "http://127.0.0.1:2145/demo-splitify/asia-south1/reports/api/reports/:path*",
      },
      {
        source: "/api/webauthn/:path*",
        destination:
          "http://127.0.0.1:2145/demo-splitify/asia-south1/webauthn/api/webauthn/:path*",
      },
    ]);
  });
});

describe("ensureFunctionsSecret", () => {
  it("creates a 48-character URL-safe SESSION_PASSWORD once and keeps it after", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "fn-secret-"));
    expect(ensureFunctionsSecret(dir)).toBe("created");
    const file = path.join(dir, ".secret.local");
    const first = readFileSync(file, "utf8");
    expect(first).toMatch(/^SESSION_PASSWORD=[A-Za-z0-9_-]{48}\n?$/);
    expect(ensureFunctionsSecret(dir)).toBe("kept");
    expect(readFileSync(file, "utf8")).toBe(first);
  });
});

describe("webDevEnv", () => {
  it("points the browser at the emulators as demo-splitify", () => {
    expect(webDevEnv()).toEqual({
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-splitify",
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-splitify.firebaseapp.com",
    });
  });
});
