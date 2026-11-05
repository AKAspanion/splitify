import { beforeAll, describe, expect, it, vi } from "vitest";
import { getAuth } from "firebase/auth";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import {
  signInTestUser,
  type TestUser,
} from "../../../dataconnect/test-utils/emulator";
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
