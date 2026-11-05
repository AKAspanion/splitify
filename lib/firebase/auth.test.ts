// Sign-out deletes the signed-out person's saved cache from IndexedDB, which Node does not have.
import "fake-indexeddb/auto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_HOST } from "../../dataconnect/test-utils/emulator-ports";

// Read when lib/firebase/app.ts first builds the app, so they are set before the dynamic import below.
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-splitify";
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "demo-key";
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS = "true";

const PASSWORD = "test-password-123";

type Auth = typeof import("./auth");
let auth: Auth;
let getFirebaseAuth: typeof import("./app").getFirebaseAuth;
let seed: typeof import("../../dataconnect/test-utils/emulator").seed;
let resetDatabase: typeof import("../../dataconnect/test-utils/emulator").resetDatabase;

type OobCode = { email: string; requestType: string; oobCode: string };

async function oobCodes(): Promise<OobCode[]> {
  const response = await fetch(
    `http://${AUTH_HOST}/emulator/v1/projects/demo-splitify/oobCodes`,
  );
  return ((await response.json()) as { oobCodes: OobCode[] }).oobCodes;
}

/** The latest code the emulator sent to this address for this request type. */
async function latestCode(
  email: string,
  requestType: "PASSWORD_RESET" | "VERIFY_EMAIL",
): Promise<string> {
  const match = (await oobCodes())
    .filter((c) => c.email === email && c.requestType === requestType)
    .at(-1);
  if (!match) throw new Error(`No ${requestType} code for ${email}`);
  return match.oobCode;
}

/** Deletes an account on the Auth emulator, as an admin would, leaving this browser's sign-in stale. */
async function deleteAccount(uid: string): Promise<void> {
  const response = await fetch(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/projects/demo-splitify/accounts:delete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer owner",
      },
      body: JSON.stringify({ localId: uid }),
    },
  );
  if (!response.ok)
    throw new Error(`Could not delete the account: ${response.status}`);
}

/** Applies a verify-email code straight on the Auth emulator, as another device opening the link would. */
async function applyCodeElsewhere(oobCode: string): Promise<void> {
  const response = await fetch(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oobCode }),
    },
  );
  if (!response.ok)
    throw new Error(`Could not apply the code: ${response.status}`);
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
  ({ getFirebaseAuth } = await import("./app"));
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

  it("reads a reset code's email, sets the new password, and refuses the old one", async () => {
    await auth.signUpWithEmail("reset2@example.test", PASSWORD, "Reset Two");
    await auth.signOut();
    await auth.sendPasswordReset("reset2@example.test");
    const code = await latestCode("reset2@example.test", "PASSWORD_RESET");

    await expect(auth.readPasswordResetEmail(code)).resolves.toBe(
      "reset2@example.test",
    );
    await auth.resetPassword(code, "new-password-456");

    await auth.signInWithEmail("reset2@example.test", "new-password-456");
    await auth.signOut();
    // The emulator answers wrong-password; production, with email enumeration protection, invalid-credential.
    await expect(
      auth.signInWithEmail("reset2@example.test", PASSWORD),
    ).rejects.toMatchObject({
      code: expect.stringMatching(
        /^auth\/(wrong-password|invalid-credential)$/,
      ),
    });
  });

  it("refuses a reset code that was already used, and one that isn't a code", async () => {
    await auth.signUpWithEmail("reset3@example.test", PASSWORD, "Reset Three");
    await auth.signOut();
    await auth.sendPasswordReset("reset3@example.test");
    const code = await latestCode("reset3@example.test", "PASSWORD_RESET");
    await auth.resetPassword(code, "new-password-456");

    await expect(
      auth.resetPassword(code, "another-password-789"),
    ).rejects.toMatchObject({ code: "auth/invalid-action-code" });
    await expect(
      auth.readPasswordResetEmail("not-a-code"),
    ).rejects.toMatchObject({ code: "auth/invalid-action-code" });
  });

  it("verifies the signed-in person's email with the code, and refuses the code a second time", async () => {
    const seen: ({ emailVerified: boolean } | null)[] = [];
    const stop = auth.onUserChanged((u) => seen.push(u));
    await auth.signUpWithEmail("verify@example.test", PASSWORD, "Verify");
    expect(seen.at(-1)).toMatchObject({ emailVerified: false });
    const code = await latestCode("verify@example.test", "VERIFY_EMAIL");

    await auth.verifyEmailWithCode(code);

    // Read without reloading: verifyEmailWithCode has reloaded the signed-in person itself.
    expect(getFirebaseAuth().currentUser?.emailVerified).toBe(true);
    const token = await getFirebaseAuth().currentUser!.getIdTokenResult();
    expect(token.claims.email_verified).toBe(true);
    await expect(auth.reloadEmailVerified()).resolves.toBe(true);

    await expect(auth.verifyEmailWithCode(code)).rejects.toMatchObject({
      code: "auth/invalid-action-code",
    });
    stop();
  });

  it("tells every listener the email is verified once verifyEmailWithCode applies the code, without a reload", async () => {
    const seen: ({ uid: string; emailVerified: boolean } | null)[] = [];
    const stop = auth.onUserChanged((u) => seen.push(u));
    await auth.signUpWithEmail("verify4@example.test", PASSWORD, "Verify Four");
    await vi.waitFor(() =>
      expect(seen.at(-1)).toMatchObject({ emailVerified: false }),
    );
    const code = await latestCode("verify4@example.test", "VERIFY_EMAIL");

    await auth.verifyEmailWithCode(code);

    await vi.waitFor(() =>
      expect(seen.at(-1)).toMatchObject({
        uid: getFirebaseAuth().currentUser!.uid,
        emailVerified: true,
      }),
    );
    stop();
  });

  it("tells every listener the email is verified once reloadEmailVerified sees a verification done elsewhere", async () => {
    const seen: ({ emailVerified: boolean } | null)[] = [];
    const stop = auth.onUserChanged((u) => seen.push(u));
    await auth.signUpWithEmail("verify5@example.test", PASSWORD, "Verify Five");
    const code = await latestCode("verify5@example.test", "VERIFY_EMAIL");
    // Applied on another device: this browser's SDK isn't told.
    await applyCodeElsewhere(code);
    await vi.waitFor(() =>
      expect(seen.at(-1)).toMatchObject({ emailVerified: false }),
    );

    await expect(auth.reloadEmailVerified()).resolves.toBe(true);

    await vi.waitFor(() =>
      expect(seen.at(-1)).toMatchObject({ emailVerified: true }),
    );
    stop();
  });

  it("verifies an email with nobody signed in", async () => {
    await auth.signUpWithEmail("verify2@example.test", PASSWORD, "Verify Two");
    await auth.signOut();
    const code = await latestCode("verify2@example.test", "VERIFY_EMAIL");

    await expect(auth.verifyEmailWithCode(code)).resolves.toBeUndefined();

    await auth.signInWithEmail("verify2@example.test", PASSWORD);
    await expect(auth.reloadEmailVerified()).resolves.toBe(true);
  });

  it("resolves once the code is applied even when reloading the signed-in person fails, and logs only the error's class", async () => {
    await auth.signUpWithEmail(
      "verify3@example.test",
      PASSWORD,
      "Verify Three",
    );
    await auth.signOut();
    const code = await latestCode("verify3@example.test", "VERIFY_EMAIL");
    // Someone else is signed in on this browser, and their account is gone, so their reload fails.
    await auth.signUpWithEmail("stale@example.test", PASSWORD, "Stale");
    await deleteAccount(getFirebaseAuth().currentUser!.uid);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await expect(auth.verifyEmailWithCode(code)).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        "Verify email: the code was applied but reloading the signed-in person failed",
        "FirebaseError",
      );
      expect(JSON.stringify(warn.mock.calls)).not.toContain(code);
    } finally {
      warn.mockRestore();
    }

    await auth.signOut();
    await auth.signInWithEmail("verify3@example.test", PASSWORD);
    await expect(auth.reloadEmailVerified()).resolves.toBe(true);
  });
});
