import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign,
  type KeyObject,
} from "node:crypto";
import { getAuth } from "firebase/auth";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import {
  adminConnector,
  resetDatabase,
  seedUser,
  signInTestUser,
  type TestUser,
} from "../../../dataconnect/test-utils/emulator";
import * as logger from "firebase-functions/logger";
import { handleWebauthn, webauthn } from "./index";

vi.mock("firebase-functions/logger", () => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}));

const PASSWORD = "p".repeat(40);
const RP_ID = "splitify.spanion.in";
const ORIGIN = "https://splitify.spanion.in";

// ---- A software authenticator: ES256 key, "none" attestation. ----

const b64u = (buf: Uint8Array) => Buffer.from(buf).toString("base64url");
const sha256 = (buf: Uint8Array | string) =>
  createHash("sha256").update(buf).digest();

/** The few CBOR types a "none" attestation and a COSE key need. */
type Cbor = number | string | Uint8Array | Map<Cbor, Cbor>;
function cbor(value: Cbor): Buffer {
  const head = (major: number, n: number) => {
    if (n < 24) return Buffer.from([(major << 5) | n]);
    if (n < 256) return Buffer.from([(major << 5) | 24, n]);
    return Buffer.from([(major << 5) | 25, n >> 8, n & 255]);
  };
  if (typeof value === "number")
    return value >= 0 ? head(0, value) : head(1, -1 - value);
  if (typeof value === "string") {
    const bytes = Buffer.from(value);
    return Buffer.concat([head(3, bytes.length), bytes]);
  }
  if (value instanceof Uint8Array)
    return Buffer.concat([head(2, value.length), value]);
  return Buffer.concat([
    head(5, value.size),
    ...[...value].flatMap(([k, v]) => [cbor(k), cbor(v)]),
  ]);
}

class Authenticator {
  private readonly privateKey: KeyObject;
  readonly credentialId = randomBytes(16);
  private readonly x: Buffer;
  private readonly y: Buffer;
  counter = 0;

  constructor() {
    const { publicKey, privateKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256",
    });
    this.privateKey = privateKey;
    const jwk = publicKey.export({ format: "jwk" });
    this.x = Buffer.from(jwk.x!, "base64url");
    this.y = Buffer.from(jwk.y!, "base64url");
  }

  private clientData(type: string, challenge: string, origin: string) {
    return Buffer.from(
      JSON.stringify({ type, challenge, origin, crossOrigin: false }),
    );
  }

  register(challenge: string, origin = ORIGIN) {
    const coseKey = cbor(
      new Map<Cbor, Cbor>([
        [1, 2],
        [3, -7],
        [-1, 1],
        [-2, this.x],
        [-3, this.y],
      ]),
    );
    const idLength = Buffer.alloc(2);
    idLength.writeUInt16BE(this.credentialId.length);
    const counter = Buffer.alloc(4);
    counter.writeUInt32BE(this.counter);
    const authData = Buffer.concat([
      sha256(RP_ID),
      Buffer.from([0x41]),
      counter,
      Buffer.alloc(16),
      idLength,
      this.credentialId,
      coseKey,
    ]);
    const attestationObject = cbor(
      new Map<Cbor, Cbor>([
        ["fmt", "none"],
        ["attStmt", new Map()],
        ["authData", authData],
      ]),
    );
    return {
      id: b64u(this.credentialId),
      rawId: b64u(this.credentialId),
      type: "public-key",
      clientExtensionResults: {},
      response: {
        clientDataJSON: b64u(
          this.clientData("webauthn.create", challenge, origin),
        ),
        attestationObject: b64u(attestationObject),
        transports: ["internal"],
      },
    };
  }

  /** Signs an assertion with the given counter (the next one by default). */
  authenticate(challenge: string, counter = this.counter + 1) {
    this.counter = counter;
    const clientDataJSON = this.clientData("webauthn.get", challenge, ORIGIN);
    const count = Buffer.alloc(4);
    count.writeUInt32BE(counter);
    const authData = Buffer.concat([sha256(RP_ID), Buffer.from([0x01]), count]);
    const signature = sign(
      "sha256",
      Buffer.concat([authData, sha256(clientDataJSON)]),
      this.privateKey,
    );
    return {
      id: b64u(this.credentialId),
      rawId: b64u(this.credentialId),
      type: "public-key",
      clientExtensionResults: {},
      response: {
        authenticatorData: b64u(authData),
        clientDataJSON: b64u(clientDataJSON),
        signature: b64u(signature),
      },
    };
  }
}

// ---- A fake request and response, with a cookie jar that works like a browser's. ----

let alice: TestUser;
let bob: TestUser;
let aliceToken: string;
let bobToken: string;

beforeAll(async () => {
  alice = await signInTestUser("alice");
  bob = await signInTestUser("bob");
  aliceToken = await getAuth(alice.dc.app).currentUser!.getIdToken();
  bobToken = await getAuth(bob.dc.app).currentUser!.getIdToken();
});

beforeEach(async () => {
  vi.clearAllMocks();
  process.env.SESSION_PASSWORD = PASSWORD;
  await resetDatabase();
  await seedUser({ id: alice.uid, email: alice.email, signedUp: true });
  await seedUser({ id: bob.uid, email: bob.email, signedUp: true });
});

type Answer = {
  status: number;
  body: any;
  headers: Record<string, unknown>;
};

/** One browser: it keeps the challenge cookie the function sets. */
class Browser {
  cookie = "";
  constructor(private token: string | undefined) {}

  async call(
    method: "GET" | "POST",
    route: string,
    body?: unknown,
  ): Promise<Answer> {
    const headers: Record<string, string> = {};
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    if (this.cookie) headers.cookie = this.cookie;
    if (body !== undefined) headers["content-type"] = "application/json";
    const raw =
      body === undefined ? undefined : Buffer.from(JSON.stringify(body));
    const req = {
      headers,
      method,
      path: `/api/webauthn${route}`,
      rawBody: raw,
    } as unknown as Request;
    const answer: Answer = { status: 0, body: undefined, headers: {} };
    const res = {
      headersSent: false as boolean,
      status(code: number) {
        answer.status = code;
        return this;
      },
      json(value: unknown) {
        answer.body = value;
        (this as { headersSent: boolean }).headersSent = true;
        return this;
      },
      setHeader(name: string, value: unknown) {
        answer.headers[name.toLowerCase()] = value;
        return this;
      },
      getHeader(name: string) {
        return answer.headers[name.toLowerCase()];
      },
    } as unknown as Response;
    await handleWebauthn(req, res);
    const setCookie = answer.headers["set-cookie"] as string[] | undefined;
    for (const line of setCookie ?? []) {
      const pair = line.split(";")[0];
      this.cookie = pair.endsWith("=") ? "" : pair;
    }
    return answer;
  }
}

const storedDevices = async (uid: string) => {
  const { data } = await adminConnector({
    connector: "admin",
    service: "splitify",
    location: "asia-south1",
  }).executeQuery<{ authnDevice: { devices: any[] } | null }, unknown>(
    "GetDevices",
    { userId: uid },
  );
  return data.authnDevice?.devices ?? [];
};

const register = async (
  browser: Browser,
  device: Authenticator,
  extra = {},
) => {
  const options = await browser.call("GET", "/generate-registration-options");
  expect(options.status).toBe(200);
  return browser.call("POST", "/verify-registration", {
    ...device.register(options.body.data.challenge),
    ...extra,
  });
};

const authenticate = async (
  browser: Browser,
  device: Authenticator,
  counter?: number,
) => {
  const options = await browser.call("GET", "/generate-authentication-options");
  expect(options.status).toBe(200);
  return browser.call(
    "POST",
    "/verify-authentication",
    device.authenticate(options.body.data.challenge, counter),
  );
};

describe("webauthn function", () => {
  it("declares a public invoker so every deploy keeps it callable", () => {
    expect(webauthn.__endpoint.httpsTrigger?.invoker).toEqual(["public"]);
  });

  it("registers a device for the token's uid, ignoring a user id in the body", async () => {
    const browser = new Browser(aliceToken);
    const device = new Authenticator();

    const answer = await register(browser, device, {
      userId: bob.uid,
      uid: bob.uid,
      user: { id: bob.uid },
    });

    expect(answer.status).toBe(200);
    expect(answer.body).toEqual({ data: { verified: true } });
    expect(await storedDevices(alice.uid)).toHaveLength(1);
    expect(await storedDevices(bob.uid)).toHaveLength(0);

    const listed = await browser.call("GET", "/devices");
    expect(listed.body.data).toHaveLength(1);
    expect(listed.body.data[0].id).toBe(b64u(device.credentialId));
  });

  it("does not save the same device twice", async () => {
    const browser = new Browser(aliceToken);
    const device = new Authenticator();
    await register(browser, device);
    await register(browser, device);
    expect(await storedDevices(alice.uid)).toHaveLength(1);
  });

  it("verifies an authentication and saves the higher counter", async () => {
    const browser = new Browser(aliceToken);
    const device = new Authenticator();
    await register(browser, device);
    expect((await storedDevices(alice.uid))[0].counter).toBe(0);

    const answer = await authenticate(browser, device, 5);

    expect(answer.status).toBe(200);
    expect(answer.body).toEqual({ data: { verified: true } });
    expect((await storedDevices(alice.uid))[0].counter).toBe(5);
  });

  it("refuses a replayed response with the old counter and keeps the saved one", async () => {
    const browser = new Browser(aliceToken);
    const device = new Authenticator();
    await register(browser, device);
    await authenticate(browser, device, 5);

    const replay = await authenticate(browser, device, 5);
    expect(replay.status).toBe(400);
    expect(replay.body.data).toBeUndefined();

    const older = await authenticate(browser, device, 3);
    expect(older.status).toBe(400);
    expect((await storedDevices(alice.uid))[0].counter).toBe(5);
  });

  it("does not accept the same authentication response twice: the challenge is used up", async () => {
    const browser = new Browser(aliceToken);
    const device = new Authenticator();
    await register(browser, device);
    const options = await browser.call(
      "GET",
      "/generate-authentication-options",
    );
    const response = device.authenticate(options.body.data.challenge, 2);
    expect(
      (await browser.call("POST", "/verify-authentication", response)).status,
    ).toBe(200);
    expect(
      (await browser.call("POST", "/verify-authentication", response)).status,
    ).toBe(400);
  });

  it("answers 400 and saves nothing when the session has no challenge", async () => {
    const device = new Authenticator();
    const registration = await new Browser(aliceToken).call(
      "POST",
      "/verify-registration",
      device.register("c2lsbHk"),
    );
    expect(registration.status).toBe(400);
    expect(registration.body).toEqual({
      message: "No registration in progress",
    });
    expect(await storedDevices(alice.uid)).toHaveLength(0);

    const authentication = await new Browser(aliceToken).call(
      "POST",
      "/verify-authentication",
      device.authenticate("c2lsbHk"),
    );
    expect(authentication.status).toBe(400);
    expect(authentication.body).toEqual({
      message: "No authentication in progress",
    });
  });

  it("refuses a registration for a challenge it did not issue, or from another origin, and saves nothing", async () => {
    const browser = new Browser(aliceToken);
    const device = new Authenticator();
    await browser.call("GET", "/generate-registration-options");
    const wrongChallenge = await browser.call(
      "POST",
      "/verify-registration",
      device.register(b64u(randomBytes(32))),
    );
    expect(wrongChallenge.status).toBe(400);

    const options = await browser.call("GET", "/generate-registration-options");
    const wrongOrigin = await browser.call(
      "POST",
      "/verify-registration",
      device.register(options.body.data.challenge, "https://evil.example"),
    );
    expect(wrongOrigin.status).toBe(400);
    expect(await storedDevices(alice.uid)).toHaveLength(0);
  });

  it("answers 400 for a body that is not a response", async () => {
    const browser = new Browser(aliceToken);
    await browser.call("GET", "/generate-registration-options");
    expect(
      (await browser.call("POST", "/verify-registration", [1])).status,
    ).toBe(400);
    await browser.call("GET", "/generate-authentication-options");
    expect(
      (await browser.call("POST", "/verify-authentication", { rawId: 5 }))
        .status,
    ).toBe(400);
    expect((await browser.call("POST", "/verify-authentication")).status).toBe(
      400,
    );
  });

  it("does not let another user authenticate with a registered credential", async () => {
    const device = new Authenticator();
    await register(new Browser(aliceToken), device);

    const answer = await authenticate(new Browser(bobToken), device);
    expect(answer.status).toBe(400);
    expect(answer.body).toEqual({
      message: "Authenticator is not registered with this site",
    });
  });

  it("removes only the caller's devices", async () => {
    const aliceBrowser = new Browser(aliceToken);
    await register(aliceBrowser, new Authenticator());
    await register(new Browser(bobToken), new Authenticator());

    const answer = await aliceBrowser.call("POST", "/devices/remove");
    expect(answer.status).toBe(200);
    expect((await aliceBrowser.call("GET", "/devices")).body).toEqual({
      data: [],
    });
    expect(await storedDevices(bob.uid)).toHaveLength(1);
  });

  it("answers 401 on each route without a valid token, and marks every answer private", async () => {
    const routes: ["GET" | "POST", string][] = [
      ["GET", "/devices"],
      ["POST", "/devices/remove"],
      ["GET", "/generate-registration-options"],
      ["POST", "/verify-registration"],
      ["GET", "/generate-authentication-options"],
      ["POST", "/verify-authentication"],
    ];
    for (const token of [undefined, "not.a.token"]) {
      for (const [method, route] of routes) {
        const answer = await new Browser(token).call(method, route);
        expect(answer.status, `${method} ${route}`).toBe(401);
        expect(answer.body).toEqual({ message: "Sign in again to continue." });
        expect(answer.headers["cache-control"]).toBe("private");
      }
    }
  });

  it("answers 404 for an unknown route and 405 for the wrong method", async () => {
    const browser = new Browser(aliceToken);
    expect((await browser.call("GET", "/nope")).status).toBe(404);
    expect((await browser.call("GET", "/devices/remove")).status).toBe(405);
    expect((await browser.call("POST", "/devices")).status).toBe(405);
  });

  it("seals the challenge cookie for __session, httpOnly, and keeps it out of the body", async () => {
    const browser = new Browser(aliceToken);
    const answer = await browser.call(
      "GET",
      "/generate-authentication-options",
    );
    const [cookie] = answer.headers["set-cookie"] as string[];
    expect(cookie.startsWith("__session=")).toBe(true);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).not.toContain(answer.body.data.challenge);
  });

  it("refuses to start the session without SESSION_PASSWORD, and logs the cause class only", async () => {
    delete process.env.SESSION_PASSWORD;
    const browser = new Browser(aliceToken);
    const answer = await browser.call(
      "GET",
      "/generate-authentication-options",
    );
    expect(answer.status).toBe(500);
    expect(answer.body).toEqual({ message: "Something went wrong" });
    expect(answer.headers["set-cookie"]).toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith("webauthn: request failed", {
      operation: "/generate-authentication-options",
      cause: "Error",
    });
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain(
      "SESSION_PASSWORD",
    );

    process.env.SESSION_PASSWORD = "too short";
    expect(
      (
        await new Browser(aliceToken).call(
          "GET",
          "/generate-registration-options",
        )
      ).status,
    ).toBe(500);
  });
});
