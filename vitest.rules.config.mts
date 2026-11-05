import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Run by `pnpm test:rules`, inside `firebase emulators:exec`: the tests that need the Auth and SQL Connect emulators.
export default defineConfig({
  resolve: {
    alias: {
      // The app code under test reads these from the rule tests' env, not the dev ports (a more specific key goes first).
      "@/lib/firebase/emulators": root(
        "./dataconnect/test-utils/emulator-ports.ts",
      ),
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
