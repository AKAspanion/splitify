// Sign-out deletes the signed-out person's saved cache from IndexedDB, which Node does not have.
import "fake-indexeddb/auto";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AUTH_HOST } from "../../dataconnect/test-utils/emulator-ports";

// Read when lib/firebase/app.ts first builds the app, so they are set before the dynamic import below.
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-splitify";
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "demo-key";
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS = "true";

const PASSWORD = "test-password-123";

type Auth = typeof import("./auth");
let auth: Auth;
let seed: typeof import("../../dataconnect/test-utils/emulator").seed;
let resetDatabase: typeof import("../../dataconnect/test-utils/emulator").resetDatabase;

async function oobCodes(): Promise<{ email: string; requestType: string }[]> {
  const response = await fetch(
    `http://${AUTH_HOST}/emulator/v1/projects/demo-splitify/oobCodes`,
  );
  return ((await response.json()) as { oobCodes: never[] }).oobCodes;
}

async function users() {
  return (
    (await seed(`query { users { id email name signedUp } }`)) as {
      users: { id: string; email: string; name: string; signedUp: boolean }[];
    }
  ).users;
}

beforeAll(async () => {
  auth = await import("./auth");
  ({ seed, resetDatabase } =
    await import("../../dataconnect/test-utils/emulator"));
});

beforeEach(async () => {
  await resetDatabase();
  await auth.signOut();
});

describe("lib/firebase/auth", () => {
  it("signs up with email: sends the verification email and runs UpsertMe", async () => {
    await auth.signUpWithEmail("Signup@Example.test", PASSWORD, "Sign Up");

    expect(await oobCodes()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: "signup@example.test",
          requestType: "VERIFY_EMAIL",
        }),
      ]),
    );
    const rows = await users();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      email: "signup@example.test",
      name: "Sign Up",
      signedUp: true,
    });
  });

  it("signs in with email and runs UpsertMe, then reports the user and signs out", async () => {
    await auth.signUpWithEmail("again@example.test", PASSWORD, "Again");
    await auth.signOut();
    await seed(`mutation { user_deleteMany(all: true) }`);

    const seen: ({ uid: string; emailVerified: boolean } | null)[] = [];
    const stop = auth.onUserChanged((u) => seen.push(u));
    await auth.signInWithEmail("again@example.test", PASSWORD);
    expect((await users()).map((u) => u.email)).toEqual(["again@example.test"]);
    expect(seen.at(-1)).toMatchObject({
      email: "again@example.test",
      emailVerified: false,
    });

    await auth.signOut();
    expect(seen.at(-1)).toBeNull();
    stop();
  });

  it("rejects a wrong password without writing a row", async () => {
    await auth.signUpWithEmail("wrong@example.test", PASSWORD, "Wrong");
    await auth.signOut();
    await seed(`mutation { user_deleteMany(all: true) }`);

    await expect(
      auth.signInWithEmail("wrong@example.test", "not-the-password"),
    ).rejects.toThrow();
    expect(await users()).toEqual([]);
  });

  it("sends a password reset email for a signed-up address", async () => {
    await auth.signUpWithEmail("reset@example.test", PASSWORD, "Reset");
    await auth.sendPasswordReset("reset@example.test");

    expect(await oobCodes()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: "reset@example.test",
          requestType: "PASSWORD_RESET",
        }),
      ]),
    );
  });
});
