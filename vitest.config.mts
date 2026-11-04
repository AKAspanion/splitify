import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  // Tests that need the Firebase emulators run only through `yarn test:rules`.
  test: {
    environment: "node",
    exclude: [
      ...configDefaults.exclude,
      "dataconnect/**/*.test.ts",
      "functions/src/**/*.test.ts",
      "lib/firebase/**/*.test.ts",
    ],
  },
});
