import { getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDataConnect } from "firebase-admin/data-connect";
import * as logger from "firebase-functions/logger";
import { defineSecret, defineString } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
  WebAuthnCredential,
} from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import { guard } from "../http/guard";
import { getChallengeSession } from "./session";

const REGION = "asia-south1";
const SERVICE = "splitify";
const ADMIN_APP = "webauthn";

const SESSION_PASSWORD = defineSecret("SESSION_PASSWORD");
const DEFAULT_RP_ID = "splitify.spanion.in";
const DEFAULT_ORIGIN = "https://splitify.spanion.in";
const AUTHN_RP_ID = defineString("AUTHN_RP_ID", { default: DEFAULT_RP_ID });
const AUTHN_EXPECTED_ORIGIN = defineString("AUTHN_EXPECTED_ORIGIN", {
  default: DEFAULT_ORIGIN,
});

// A param's value is empty when the function runs without the deploy that resolves its default.
const rpId = () => AUTHN_RP_ID.value() || DEFAULT_RP_ID;
const expectedOrigin = () => AUTHN_EXPECTED_ORIGIN.value() || DEFAULT_ORIGIN;

function adminApp(): App {
  return getApps().some((a) => a.name === ADMIN_APP)
    ? getApp(ADMIN_APP)
    : initializeApp({}, ADMIN_APP);
}

// Only `admin` connector operations run here: `NO_ACCESS` operations that no signed-in person can call.
function adminConnector() {
  return getDataConnect(
    { serviceId: SERVICE, location: REGION, connector: "admin" },
    adminApp(),
  );
}

/** The class of an error, for logs: never its message, which can hold a token or a key. */
const causeClass = (error: unknown): string =>
  error instanceof Error ? error.constructor.name : typeof error;

/**
 * How a device is stored in `AuthnDevice.devices`: the shape SimpleWebAuthn 9 called `AuthenticatorDevice`, with each
 * byte array serialised as an index-keyed object. It is kept as is, so passkeys registered before the move to
 * functions still work, and converted to SimpleWebAuthn's `WebAuthnCredential` on the way in and out.
 */
type StoredDevice = {
  credentialPublicKey: Uint8Array;
  credentialID: Uint8Array;
  counter: number;
  transports?: WebAuthnCredential["transports"];
};

const toCredential = (device: StoredDevice): WebAuthnCredential => ({
  id: isoBase64URL.fromBuffer(device.credentialID as Uint8Array<ArrayBuffer>),
  publicKey: device.credentialPublicKey as Uint8Array<ArrayBuffer>,
  counter: device.counter,
  transports: device.transports,
});

const toStoredDevice = (credential: WebAuthnCredential): StoredDevice => ({
  credentialPublicKey: credential.publicKey,
  credentialID: isoBase64URL.toBuffer(credential.id),
  counter: credential.counter,
  transports: credential.transports,
});

/** Bytes as stored: an index-keyed object (`JSON.stringify` of a `Uint8Array`) or an array. */
const toBytes = (value: unknown): Uint8Array => {
  if (!value || typeof value !== "object") throw new Error("not bytes");
  return Uint8Array.from(Object.values(value as Record<string, number>));
};

const parseDevices = (stored: unknown): StoredDevice[] => {
  if (!Array.isArray(stored)) return [];
  return stored.map((device: Record<string, unknown>) => ({
    credentialPublicKey: toBytes(device.credentialPublicKey),
    credentialID: toBytes(device.credentialID),
    counter: Number(device.counter),
    transports: device.transports as WebAuthnCredential["transports"],
  }));
};

const readDevices = async (userId: string): Promise<StoredDevice[]> => {
  const { data } = await adminConnector().executeQuery<
    { authnDevice: { devices: unknown } | null },
    { userId: string }
  >("GetDevices", { userId });
  return parseDevices(data.authnDevice?.devices);
};

const saveDevices = async (
  userId: string,
  devices: StoredDevice[],
): Promise<void> => {
  await adminConnector().executeMutation("SaveDevices", {
    userId,
    // A Uint8Array serialises as an index-keyed object, which is the stored shape.
    devices: JSON.parse(JSON.stringify(devices)),
  });
};

const getCredentials = async (userId: string) =>
  (await readDevices(userId)).map(toCredential);

const SOMETHING_WENT_WRONG = { message: "Something went wrong" };

type Ctx = { req: Request; res: Response; uid: string; body: unknown };

const session = (ctx: Ctx) =>
  getChallengeSession(ctx.req, ctx.res, SESSION_PASSWORD.value());

const listDevices = async ({ res, uid }: Ctx) => {
  res.status(200).json({ data: await getCredentials(uid) });
};

const removeDevices = async ({ res, uid }: Ctx) => {
  await saveDevices(uid, []);
  res.status(200).json({ message: "Devices removed" });
};

const registrationOptions = async (ctx: Ctx) => {
  const { res, uid } = ctx;
  const user = await getAuth(adminApp()).getUser(uid);
  const devices = await getCredentials(uid);

  const data = await generateRegistrationOptions({
    rpName: "Splitify WebAuthn",
    rpID: rpId(),
    // SimpleWebAuthn 9 sent the user id's UTF-8 bytes as the user handle; keep sending the same bytes.
    userID: isoUint8Array.fromUTF8String(uid),
    userName: user.displayName || user.email || uid,
    timeout: 60000,
    attestationType: "none",
    // Stops the same device being registered twice: the authenticator refuses to register again.
    excludeCredentials: devices.map((dev) => ({
      id: dev.id,
      transports: dev.transports,
    })),
    authenticatorSelection: {
      residentKey: "discouraged",
      // https://passkeys.dev/docs/use-cases/bootstrapping/#a-note-about-user-verification
      userVerification: "preferred",
    },
    // ES256 and RS256, the two most common algorithms.
    supportedAlgorithmIDs: [-7, -257],
  });

  // The challenge is remembered until the verification arrives.
  const challenge = await session(ctx);
  challenge.currentChallenge = data.challenge;
  await challenge.save();

  res.status(200).json({ data });
};

const verifyRegistration = async (ctx: Ctx) => {
  const { res, uid, body } = ctx;
  const challenge = await session(ctx);
  const expectedChallenge = challenge.currentChallenge;
  if (!expectedChallenge) {
    res.status(400).json({ message: "No registration in progress" });
    return;
  }

  if (!isObject(body) || !isObject(body.response)) {
    res.status(400).json({ message: "That request could not be read." });
    return;
  }
  const response = body as unknown as RegistrationResponseJSON;

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: expectedOrigin(),
      expectedRPID: rpId(),
      requireUserVerification: false,
    });
  } catch (error) {
    logger.warn("webauthn: registration not verified", {
      operation: "verify-registration",
      cause: causeClass(error),
    });
    res.status(400).json({ message: "Registration could not be verified" });
    return;
  }

  const { verified, registrationInfo } = verification;
  if (verified && registrationInfo) {
    const { credential } = registrationInfo;
    const devices = await readDevices(uid);
    const known = devices.some(
      (device) =>
        isoBase64URL.fromBuffer(
          device.credentialID as Uint8Array<ArrayBuffer>,
        ) === credential.id,
    );
    if (!known) {
      devices.push(
        toStoredDevice({
          id: credential.id,
          publicKey: credential.publicKey,
          counter: credential.counter,
          transports: response.response.transports,
        }),
      );
      await saveDevices(uid, devices);
    }
  }

  challenge.currentChallenge = undefined;
  await challenge.save();

  res.status(200).json({ data: { verified } });
};

const authenticationOptions = async (ctx: Ctx) => {
  const { res, uid } = ctx;
  const devices = await getCredentials(uid);

  const data = await generateAuthenticationOptions({
    timeout: 60000,
    allowCredentials: devices.map((dev) => ({
      id: dev.id,
      transports: dev.transports,
    })),
    // https://passkeys.dev/docs/use-cases/bootstrapping/#a-note-about-user-verification
    userVerification: "preferred",
    rpID: rpId(),
  });

  const challenge = await session(ctx);
  challenge.currentChallenge = data.challenge;
  await challenge.save();

  res.status(200).json({ data });
};

const verifyAuthentication = async (ctx: Ctx) => {
  const { res, uid, body } = ctx;
  const challenge = await session(ctx);
  const expectedChallenge = challenge.currentChallenge;
  if (!expectedChallenge) {
    res.status(400).json({ message: "No authentication in progress" });
    return;
  }

  if (!isObject(body) || typeof body.rawId !== "string") {
    res.status(400).json({ message: "That request could not be read." });
    return;
  }
  const response = body as unknown as AuthenticationResponseJSON;

  const devices = await readDevices(uid);
  const index = devices.findIndex(
    (dev) =>
      isoBase64URL.fromBuffer(dev.credentialID as Uint8Array<ArrayBuffer>) ===
      response.rawId,
  );
  if (index < 0) {
    res
      .status(400)
      .json({ message: "Authenticator is not registered with this site" });
    return;
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: expectedOrigin(),
      expectedRPID: rpId(),
      credential: toCredential(devices[index]),
      requireUserVerification: false,
    });
  } catch (error) {
    // This includes a replayed response, whose counter is not above the saved one.
    logger.warn("webauthn: authentication not verified", {
      operation: "verify-authentication",
      cause: causeClass(error),
    });
    res.status(400).json({ message: "Authentication could not be verified" });
    return;
  }

  const { verified, authenticationInfo } = verification;
  if (verified) {
    // Save the newest counter, so a cloned authenticator that replays an older one is caught next time.
    devices[index] = {
      ...devices[index],
      counter: authenticationInfo.newCounter,
    };
    await saveDevices(uid, devices);
  }

  challenge.currentChallenge = undefined;
  await challenge.save();

  res.status(200).json({ data: { verified } });
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type Route = { method: "GET" | "POST"; run: (ctx: Ctx) => Promise<void> };

const ROUTES = new Map<string, Route>([
  ["/devices", { method: "GET", run: listDevices }],
  ["/devices/remove", { method: "POST", run: removeDevices }],
  [
    "/generate-registration-options",
    { method: "GET", run: registrationOptions },
  ],
  ["/verify-registration", { method: "POST", run: verifyRegistration }],
  [
    "/generate-authentication-options",
    { method: "GET", run: authenticationOptions },
  ],
  ["/verify-authentication", { method: "POST", run: verifyAuthentication }],
]);

/** The route a request names: what follows `/api/webauthn`, without a trailing slash. */
const routeOf = (req: Request): string | undefined => {
  const match = /\/api\/webauthn(\/[^?]*)?$/.exec(req.path);
  return match ? (match[1] ?? "/").replace(/(.)\/$/, "$1") : undefined;
};

/** Answers the six `/api/webauthn/*` routes, each for the signed-in person only. Exported for tests. */
export async function handleWebauthn(req: Request, res: Response) {
  // The response can set the challenge cookie: nothing may cache it.
  res.setHeader("Cache-Control", "private");

  const guarded = await guard(req, res);
  if (!guarded) return;

  const name = routeOf(req);
  const route = name !== undefined ? ROUTES.get(name) : undefined;
  if (!route) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  if (req.method !== route.method) {
    res.setHeader("Allow", route.method);
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    await route.run({ req, res, uid: guarded.uid, body: guarded.body });
  } catch (error) {
    logger.error("webauthn: request failed", {
      operation: name,
      cause: causeClass(error),
    });
    if (!res.headersSent) res.status(500).json(SOMETHING_WENT_WRONG);
  }
}

export const webauthn = onRequest(
  { region: REGION, invoker: "public", secrets: [SESSION_PASSWORD] },
  handleWebauthn,
);
