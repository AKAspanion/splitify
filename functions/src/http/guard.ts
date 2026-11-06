import { getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

export type Guarded = { uid: string; body: unknown };

export const MAX_BODY_BYTES = 65536;

/**
 * The admin SDK's `verifyIdToken` error codes that refuse the caller's credentials: a malformed, expired, revoked or
 * otherwise invalid token, or a user deleted or disabled since it was issued. Any other failure of the check (an
 * internal error, a quota, a network failure fetching keys or the user) is the server's, not the caller's.
 */
export const REFUSED_SIGN_IN_CODES: ReadonlySet<string> = new Set([
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
  "auth/user-not-found",
  "auth/user-disabled",
]);

const GUARD_APP = "http-guard";

function adminApp(): App {
  return getApps().some((a) => a.name === GUARD_APP)
    ? getApp(GUARD_APP)
    : initializeApp({}, GUARD_APP);
}

/** The class of an error, for logs: never its message, which can hold a token. */
const causeClass = (error: unknown): string =>
  error instanceof Error ? error.constructor.name : typeof error;

/** A Firebase error's `code` (`auth/…`, `app/…`), for logs and for telling a refusal from a failure. */
const errorCode = (error: unknown): string | undefined => {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : undefined;
};

const bearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (typeof header !== "string") return null;
  const match = /^Bearer ([^\s]+)$/.exec(header);
  return match ? match[1] : null;
};

/**
 * The first thing every function the browser calls runs: it checks the Firebase ID token from `Authorization:
 * Bearer <token>` with the admin SDK, revocation included, then reads the body (JSON only, at most `maxBytes`).
 * It answers a refusal itself, `401`, `413`, `415` or `400`, or `500` when the token check itself fails, and
 * returns null; otherwise the caller's uid and the parsed body, which is `undefined` when the request has none.
 * The token is checked before the body is touched.
 */
export async function guard(
  req: Request,
  res: Response,
  opts: { maxBytes?: number } = {},
): Promise<Guarded | null> {
  const maxBytes = opts.maxBytes ?? MAX_BODY_BYTES;

  const signInAgain = () => {
    res.status(401).json({ message: "Sign in again to continue." });
    return null;
  };

  const token = bearerToken(req);
  if (!token) {
    logger.warn("guard: sign-in refused", { cause: "no bearer token" });
    return signInAgain();
  }

  let uid: string;
  try {
    // checkRevoked: a token issued before its refresh tokens were revoked (deleteMyAccount does), or whose user was
    // deleted or disabled, is refused, at the cost of one Auth lookup per request.
    uid = (await getAuth(adminApp()).verifyIdToken(token, true)).uid;
  } catch (error) {
    // The class and the code only: an error's message can hold the token.
    const code = errorCode(error);
    if (code !== undefined && REFUSED_SIGN_IN_CODES.has(code)) {
      logger.warn("guard: sign-in refused", { cause: causeClass(error), code });
      return signInAgain();
    }
    // Not the caller's credentials: telling them to sign in again would loop them through sign-in for nothing.
    logger.error("guard: sign-in check failed", {
      cause: causeClass(error),
      code,
    });
    res.status(500).json({ message: "Something went wrong. Try again." });
    return null;
  }

  const tooLarge = () => {
    res.status(413).json({ message: "That request is too large." });
    return null;
  };

  // The declared length refuses an oversized body before the body is read at all.
  const declared = Number(req.headers["content-length"]);
  if (Number.isFinite(declared) && declared > maxBytes) return tooLarge();

  const raw = req.rawBody;
  if (!raw || raw.length === 0) return { uid, body: undefined };
  if (raw.length > maxBytes) return tooLarge();

  const contentType = (req.headers["content-type"] ?? "").toLowerCase();
  if (!/^application\/json\s*(;|$)/.test(contentType)) {
    res.status(415).json({ message: "Send the request as JSON." });
    return null;
  }

  try {
    return { uid, body: JSON.parse(raw.toString("utf8")) };
  } catch (error) {
    logger.warn("guard: body is not JSON", { cause: causeClass(error) });
    res.status(400).json({ message: "That request could not be read." });
    return null;
  }
}
