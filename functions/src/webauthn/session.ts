import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

export type ChallengeSession = {
  currentChallenge?: string;
  save(): Promise<void>;
};

const MIN_PASSWORD_LENGTH = 32;

/** Firebase Hosting forwards only the cookie named `__session` to a function, so the challenge lives in it. */
export const CHALLENGE_COOKIE = "__session";

// A challenge is only good between the options request and its verification.
const CHALLENGE_TTL_SECONDS = 600;

/**
 * The session that holds a WebAuthn challenge between the options request and its verification. `password` is the
 * `SESSION_PASSWORD` secret, which iron-session requires to be at least 32 characters; a missing or short one throws
 * here, so the routes answer 500 instead of sealing the cookie with a weak key.
 */
export async function getChallengeSession(
  req: Request,
  res: Response,
  password: string | undefined,
): Promise<ChallengeSession> {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      "SESSION_PASSWORD is missing or shorter than 32 characters",
    );
  }
  // iron-session is an ES module, which this CommonJS package can only load with a dynamic import.
  const { getIronSession, nodeCookies } = await import("iron-session");
  return getIronSession<{ currentChallenge?: string }>(nodeCookies(req, res), {
    password,
    cookieName: CHALLENGE_COOKIE,
    ttl: CHALLENGE_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // The Functions emulator is served over plain http.
      secure: process.env.FUNCTIONS_EMULATOR !== "true",
    },
  });
}
