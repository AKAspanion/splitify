import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
} from "firebase/auth";
import {
  getApps as getAdminApps,
  initializeApp as initializeAdminApp,
} from "firebase-admin/app";
import {
  AuthErrorCode,
  BaseAuth,
  FirebaseAuthError,
  getAuth as getAdminAuth,
  type DecodedIdToken,
} from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import {
  signInTestUser,
  type TestUser,
} from "../../../dataconnect/test-utils/emulator";
import { AUTH_HOST } from "../../../dataconnect/test-utils/emulator-ports";
import { guard, MAX_BODY_BYTES } from "./guard";

vi.mock("firebase-functions/logger", () => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}));

let alice: TestUser;
let token: string;

beforeAll(async () => {
  alice = await signInTestUser("alice");
  const user = getAuth(alice.dc.app).currentUser;
  token = await user!.getIdToken();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const PROJECT_ID = "demo-splitify";
let freshCount = 0;

/** A new Auth emulator user of its own, signed in, so revoking, deleting or disabling it touches no other test. */
const freshUser = async (): Promise<{ uid: string; token: string }> => {
  const n = freshCount++;
  const app = initializeApp(
    { apiKey: "demo-api-key", projectId: PROJECT_ID },
    `guard-fresh-${n}`,
  );
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, `http://${AUTH_HOST}`, { disableWarnings: true });
  const credential = await createUserWithEmailAndPassword(
    auth,
    `guard-${Date.now()}-${n}@example.test`,
    "test-password-123",
  );
  return {
    uid: credential.user.uid,
    token: await credential.user.getIdToken(),
  };
};

const adminAuth = () => {
  const name = "guard-test-admin";
  const app =
    getAdminApps().find((a) => a.name === name) ??
    initializeAdminApp({ projectId: PROJECT_ID }, name);
  return getAdminAuth(app);
};

type Answer = { status?: number; body?: unknown };

const run = async (
  headers: Record<string, string>,
  rawBody?: Buffer | string,
  opts?: { maxBytes?: number },
) => {
  const answer: Answer = {};
  const raw =
    rawBody === undefined
      ? undefined
      : Buffer.isBuffer(rawBody)
        ? rawBody
        : Buffer.from(rawBody);
  // Reading the body is observable: a getter records that the guard asked for it.
  const reads = { count: 0 };
  const req = {
    headers,
    method: "POST",
    get rawBody() {
      reads.count += 1;
      return raw;
    },
    get body() {
      reads.count += 1;
      return undefined;
    },
    header: (name: string) => headers[name.toLowerCase()],
    get: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;
  const res = {
    status(code: number) {
      answer.status = code;
      return this;
    },
    json(body: unknown) {
      answer.body = body;
      return this;
    },
  } as unknown as Response;
  const result = await guard(req, res, opts);
  return { result, answer, reads };
};

const bearer = (value = token) => ({ authorization: `Bearer ${value}` });
const json = { "content-type": "application/json" };
const SIGN_IN = { message: "Sign in again to continue." };

describe("guard", () => {
  it.each([
    ["no Authorization header", {}],
    ["a header that is not a Bearer token", { authorization: "Basic abc" }],
    ["an empty Bearer token", { authorization: "Bearer " }],
    ["a token the admin SDK rejects", { authorization: "Bearer not.a.token" }],
  ])(
    "answers 401 and returns null for %s, before reading the body",
    async (_name, headers) => {
      const { result, answer, reads } = await run(
        { ...headers, ...json },
        '{"a":1}',
      );
      expect(result).toBeNull();
      expect(answer).toEqual({ status: 401, body: SIGN_IN });
      expect(reads.count).toBe(0);
    },
  );

  it("returns the token's uid and the parsed JSON body", async () => {
    const { result, answer } = await run(
      { ...bearer(), ...json },
      JSON.stringify({ groupId: "g1" }),
    );
    expect(answer).toEqual({});
    expect(result).toEqual({ uid: alice.uid, body: { groupId: "g1" } });
  });

  it("accepts a JSON content type with a charset, and a request with no body", async () => {
    const withCharset = await run(
      { ...bearer(), "content-type": "application/json; charset=utf-8" },
      "[1]",
    );
    expect(withCharset.result).toEqual({ uid: alice.uid, body: [1] });

    const empty = await run({ ...bearer() });
    expect(empty.result).toEqual({ uid: alice.uid, body: undefined });
  });

  it("answers 413 for a body of 65,537 bytes and takes one of exactly 65,536", async () => {
    expect(MAX_BODY_BYTES).toBe(65536);
    const pad = (n: number) => JSON.stringify({ x: "a".repeat(n - 8) });

    const over = pad(MAX_BODY_BYTES + 1);
    expect(Buffer.byteLength(over)).toBe(65537);
    const tooBig = await run({ ...bearer(), ...json }, over);
    expect(tooBig.result).toBeNull();
    expect(tooBig.answer).toEqual({
      status: 413,
      body: { message: "That request is too large." },
    });

    const exact = pad(MAX_BODY_BYTES);
    expect(Buffer.byteLength(exact)).toBe(65536);
    expect((await run({ ...bearer(), ...json }, exact)).result?.uid).toBe(
      alice.uid,
    );
  });

  it("answers 413 from the declared Content-Length without touching the body", async () => {
    const { result, answer, reads } = await run({
      ...bearer(),
      ...json,
      "content-length": "70000",
    });
    expect(result).toBeNull();
    expect(answer.status).toBe(413);
    expect(reads.count).toBe(0);
  });

  it("takes a smaller cap from its options", async () => {
    const { result, answer } = await run(
      { ...bearer(), ...json },
      JSON.stringify({ x: "a".repeat(100) }),
      { maxBytes: 50 },
    );
    expect(result).toBeNull();
    expect(answer.status).toBe(413);
  });

  it("answers 415 for a body that is not JSON", async () => {
    const { result, answer } = await run(
      { ...bearer(), "content-type": "text/plain" },
      "hello",
    );
    expect(result).toBeNull();
    expect(answer.status).toBe(415);
  });

  it("answers 400 for JSON that does not parse", async () => {
    const { result, answer } = await run({ ...bearer(), ...json }, "{nope");
    expect(result).toBeNull();
    expect(answer.status).toBe(400);
  });
});

describe("guard and revoked sign-ins", () => {
  const expectRefusedAndLogged = (
    outcome: Awaited<ReturnType<typeof run>>,
    leaked: string,
  ) => {
    expect(outcome.result).toBeNull();
    expect(outcome.answer).toEqual({ status: 401, body: SIGN_IN });
    expect(outcome.reads.count).toBe(0);
    // The cause's class, and nothing else: no code, message or token.
    expect(logger.warn).toHaveBeenCalledWith("guard: sign-in refused", {
      cause: "FirebaseAuthError",
    });
    expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain(
      leaked,
    );
  };

  it("checks revocation when it verifies a valid token, and returns the uid and body as before", async () => {
    const verify = vi.spyOn(BaseAuth.prototype, "verifyIdToken");
    const { result, answer } = await run(
      { ...bearer(), ...json },
      JSON.stringify({ groupId: "g1" }),
    );
    expect(verify).toHaveBeenCalledWith(token, true);
    expect(answer).toEqual({});
    expect(result).toEqual({ uid: alice.uid, body: { groupId: "g1" } });
  });

  // Production's admin SDK checks revocation only when asked to (the emulator's always does, so these stand in for
  // it): the token's signature is still good, and only the revocation lookup refuses it.
  it.each([
    ["token revoked", AuthErrorCode.ID_TOKEN_REVOKED],
    ["user deleted", AuthErrorCode.USER_NOT_FOUND],
    ["user disabled", AuthErrorCode.USER_DISABLED],
  ])(
    "answers 401 when only the revocation check refuses the token (%s)",
    async (_name, code) => {
      vi.spyOn(BaseAuth.prototype, "verifyIdToken").mockImplementation(
        async (_token: string, checkRevoked?: boolean) => {
          if (checkRevoked)
            throw new FirebaseAuthError({ code, message: `token ${code}` });
          return { uid: "still-signed-in" } as DecodedIdToken;
        },
      );
      vi.mocked(logger.warn).mockClear();
      const outcome = await run({ ...bearer(), ...json }, '{"a":1}');
      expectRefusedAndLogged(outcome, token);
    },
  );

  it("answers 401 for a token issued before the user's refresh tokens were revoked", async () => {
    const user = await freshUser();
    // Revocation counts in whole seconds after the token's auth_time, so let one pass.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await adminAuth().revokeRefreshTokens(user.uid);
    vi.mocked(logger.warn).mockClear();
    const outcome = await run({ ...bearer(user.token), ...json }, '{"a":1}');
    expectRefusedAndLogged(outcome, user.token);
  });

  it("answers 401 for a token whose user was deleted", async () => {
    const user = await freshUser();
    await adminAuth().deleteUser(user.uid);
    vi.mocked(logger.warn).mockClear();
    const outcome = await run({ ...bearer(user.token), ...json }, '{"a":1}');
    expectRefusedAndLogged(outcome, user.token);
  });

  it("answers 401 for a token whose user was disabled", async () => {
    const user = await freshUser();
    await adminAuth().updateUser(user.uid, { disabled: true });
    vi.mocked(logger.warn).mockClear();
    const outcome = await run({ ...bearer(user.token), ...json }, '{"a":1}');
    expectRefusedAndLogged(outcome, user.token);
  });
});
