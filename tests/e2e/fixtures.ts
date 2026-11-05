// What the end-to-end tests run on: the Firebase emulators `pnpm dev` starts (playwright.config.ts), and a test user
// made on the Auth emulator for each test with generated credentials. Nothing here may reach a real project, so every
// emulator address is checked to be on this machine before anything is sent to it.
import { randomBytes, randomUUID } from "node:crypto";
import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";

/** A person on the Auth emulator, made for one test. */
export type TestUser = { email: string; password: string; name: string };

/** The emulators' `host:port` addresses, each checked to be on this machine. */
export type EmulatorHosts = { auth: string; dataConnect: string };

/** How long the emulators get to answer, and how long each request to them may take. */
const EMULATOR_WAIT_MS = 180_000;
const REQUEST_TIMEOUT_MS = 10_000;
const POLL_TIMEOUT_MS = 2_000;
const POLL_INTERVAL_MS = 1_000;

// The Auth emulator takes any API key; this is the one the app is built with on the demo project (scripts/dev-env.mjs).
const API_KEY = "demo-key";

/**
 * The emulators' addresses from `FIREBASE_AUTH_EMULATOR_HOST` and `DATA_CONNECT_EMULATOR_HOST`, which
 * playwright.config.ts sets from firebase.json. Throws unless each is set to a loopback `host:port` and nothing else,
 * so the tests can never create a user on, or send anything to, a real project.
 */
export function emulatorHosts(
  env: NodeJS.ProcessEnv = process.env,
): EmulatorHosts {
  return {
    auth: localHost(env, "FIREBASE_AUTH_EMULATOR_HOST"),
    dataConnect: localHost(env, "DATA_CONNECT_EMULATOR_HOST"),
  };
}

const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost", "[::1]"]);

/** `env[name]` as the canonical `host:port` it parses to, when that is a loopback address with a port and nothing else. */
function localHost(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value)
    throw new Error(
      `${name} is not set: run the end-to-end tests with pnpm test:e2e, on the emulators`,
    );
  let url: URL | undefined;
  try {
    url = new URL(`http://${value}`);
  } catch {
    url = undefined;
  }
  // The parsed URL, not the raw text, decides: "127.0.0.1:1@example.com" is a host of example.com.
  if (
    !url ||
    !LOOPBACK_HOSTNAMES.has(url.hostname) ||
    !url.port ||
    url.username !== "" ||
    url.password !== "" ||
    url.pathname !== "/" ||
    url.search !== "" ||
    url.hash !== ""
  )
    throw new Error(
      `${name} must be a local emulator address such as 127.0.0.1:<port>`,
    );
  return url.host;
}

/** Resolves once the Auth and SQL Connect emulators answer; `pnpm dev` starts the site before they are up. */
export async function waitForEmulators(
  hosts: EmulatorHosts,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const deadline = Date.now() + EMULATOR_WAIT_MS;
  // The Auth emulator answers 200 at its root once it is ready; any answer from SQL Connect means it is listening.
  const checks: [string, (response: Response) => boolean][] = [
    [`http://${hosts.auth}/`, (response) => response.ok],
    [`http://${hosts.dataConnect}/`, () => true],
  ];
  for (const [url, ready] of checks) {
    for (;;) {
      try {
        const response = await fetchImpl(url, {
          signal: AbortSignal.timeout(POLL_TIMEOUT_MS),
        });
        await response.body?.cancel();
        if (ready(response)) break;
      } catch {
        // Not listening yet: try again until the deadline.
      }
      if (Date.now() > deadline)
        throw new Error(
          `The emulators did not answer at ${url} within ${EMULATOR_WAIT_MS / 1000} s: is pnpm dev running?`,
        );
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

/**
 * Makes a new person on the Auth emulator with a generated email and password, through the same sign-up API the app's
 * client calls. Refuses, before sending anything, unless the Auth emulator's address is set and local.
 */
export async function createTestUser(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<TestUser> {
  const { auth } = emulatorHosts(env);
  const user: TestUser = {
    email: `e2e-${randomUUID()}@example.test`,
    password: randomBytes(24).toString("base64url"),
    name: "E2E Tester",
  };
  const response = await fetchImpl(
    `http://${auth}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        displayName: user.name,
        returnSecureToken: false,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );
  // Only the status matters; the body is never read, so nothing of it (or of the password) reaches an error or a log.
  await response.body?.cancel();
  if (!response.ok)
    throw new Error(
      `The Auth emulator did not create the test user (HTTP ${response.status})`,
    );
  return user;
}

export const test = base.extend<
  { testUser: TestUser },
  { emulators: EmulatorHosts }
>({
  // Every test here runs on the emulators, so each worker waits for them once before its first test.
  emulators: [
    async ({}, provide) => {
      const hosts = emulatorHosts();
      await waitForEmulators(hosts);
      await provide(hosts);
    },
    { scope: "worker", auto: true, timeout: EMULATOR_WAIT_MS + 30_000 },
  ],
  testUser: async ({}, provide) => {
    await provide(await createTestUser());
  },
});
