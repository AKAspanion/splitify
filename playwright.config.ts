import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// End-to-end tests on the Firebase emulators, as `pnpm dev` runs them: no .env and no real project
// (knowledge/decisions/e2e-playwright-main-flow.md).

type EmulatorAddress = { host: string; port: number };
const emulators: Record<string, EmulatorAddress> = JSON.parse(
  readFileSync(path.join(__dirname, "firebase.json"), "utf8"),
).emulators;
const address = ({ host, port }: EmulatorAddress) => `${host}:${port}`;

// The fixtures make the test user on the Auth emulator and wait for SQL Connect at these addresses, the ones the
// browser uses (lib/firebase/emulators.ts). Set here, for the runner and its workers, over anything in the shell.
process.env.FIREBASE_AUTH_EMULATOR_HOST = address(emulators.auth);
process.env.DATA_CONNECT_EMULATOR_HOST = address(emulators.dataconnect);

const BASE_URL = "http://127.0.0.1:2140";

export default defineConfig({
  testDir: "tests/e2e",
  // The tests share one set of emulators and one `next dev`, which compiles each page on its first visit.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  // CI uploads playwright-report/ when the job fails.
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    navigationTimeout: 60_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // `pnpm dev`, run without pnpm in between so the shutdown signal reaches it alone: it builds the functions,
    // starts every emulator as demo-splitify and `next dev` on 2140 with NEXT_PUBLIC_USE_FIREBASE_EMULATORS set
    // (scripts/dev-env.mjs). Locally a running `pnpm dev` is reused; CI always starts its own.
    command: "node scripts/dev.mjs",
    url: `${BASE_URL}/sign-in/`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: "pipe",
    // dev.mjs stops its children on SIGTERM and waits up to 120 s for the emulators to export their data.
    gracefulShutdown: { signal: "SIGTERM", timeout: 150_000 },
  },
});
