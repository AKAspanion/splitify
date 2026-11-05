import { getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

export type Guarded = { uid: string; body: unknown };

export const MAX_BODY_BYTES = 65536;

const GUARD_APP = "http-guard";

function adminApp(): App {
  return getApps().some((a) => a.name === GUARD_APP)
    ? getApp(GUARD_APP)
    : initializeApp({}, GUARD_APP);
}

/** The class of an error, for logs: never its message, which can hold a token. */
const causeClass = (error: unknown): string =>
  error instanceof Error ? error.constructor.name : typeof error;

const bearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (typeof header !== "string") return null;
  const match = /^Bearer ([^\s]+)$/.exec(header);
  return match ? match[1] : null;
};

/**
 * The first thing every function the browser calls runs: it checks the Firebase ID token from `Authorization:
 * Bearer <token>` with the admin SDK, then reads the body (JSON only, at most `maxBytes`). It answers a refusal
 * itself, `401`, `413`, `415` or `400`, and returns null; otherwise the caller's uid and the parsed body, which
 * is `undefined` when the request has none. The token is checked before the body is touched.
 */
export async function guard(
  req: Request,
  res: Response,
  opts: { maxBytes?: number } = {},
): Promise<Guarded | null> {
  const maxBytes = opts.maxBytes ?? MAX_BODY_BYTES;

  const token = bearerToken(req);
  let uid: string;
  try {
    if (!token) throw new Error("no bearer token");
    uid = (await getAuth(adminApp()).verifyIdToken(token)).uid;
  } catch (error) {
    logger.warn("guard: sign-in refused", { cause: causeClass(error) });
    res.status(401).json({ message: "Sign in again to continue." });
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
