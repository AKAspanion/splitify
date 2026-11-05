import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Run by `yarn test:rules`, inside `firebase emulators:exec`: the tests that need the Auth and SQL Connect emulators.
export default defineConfig({
  resolve: {
    alias: {
      "@dataconnect/app": root("./dataconnect/generated/app"),
      "@dataconnect/admin": root("./dataconnect/generated/admin"),
      "@": root("./"),
    },
  },
  test: {
    environment: "node",
    include: [
      "dataconnect/**/*.test.ts",
      "functions/src/**/*.test.ts",
      "lib/firebase/**/*.test.ts",
      "lib/data/**/*.rules.test.ts",
    ],
    // The tests share one emulator database, so files run one after another.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
