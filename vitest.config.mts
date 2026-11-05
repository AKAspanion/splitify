import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@dataconnect/app": fileURLToPath(
        new URL("./dataconnect/generated/app", import.meta.url),
      ),
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  // Tests that need the Firebase emulators run only through `pnpm test:rules`, and the Playwright end-to-end tests only
  // through `pnpm test:e2e`.
  test: {
    environment: "node",
    exclude: [
      ...configDefaults.exclude,
      ".claude/**",
      "tests/e2e/**",
      "dataconnect/**/*.test.ts",
      "functions/src/**/*.test.ts",
      "lib/firebase/auth.test.ts",
      "lib/data/**/*.rules.test.ts",
    ],
  },
});
