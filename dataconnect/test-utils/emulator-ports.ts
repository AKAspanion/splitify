// The rule tests' emulator addresses, read from the env `firebase emulators:exec` sets for firebase.rules-test.json, so
// the tests never reach the dev emulators. vitest.rules.config.mts aliases `@/lib/firebase/emulators` to this file, so the
// app code under test (lib/firebase/app.ts, lib/data/expense-writes.ts) connects to these emulators too.
function emulatorHost(name: string): string {
  const host = process.env[name];
  if (!host) throw new Error("Run the rule tests with pnpm test:rules");
  return host;
}

export const AUTH_HOST = emulatorHost("FIREBASE_AUTH_EMULATOR_HOST");
export const DATA_CONNECT_HOST = emulatorHost("DATA_CONNECT_EMULATOR_HOST");

export const EMULATOR_HOST = AUTH_HOST.split(":")[0];
export const EMULATOR_PORTS = {
  auth: Number(AUTH_HOST.split(":")[1]),
  dataconnect: Number(DATA_CONNECT_HOST.split(":")[1]),
  // The rule tests start no Functions emulator.
  functions: 0,
} as const;
