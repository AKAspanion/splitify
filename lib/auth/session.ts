import { getIronSession } from "iron-session";
import type { IronSession } from "iron-session";
import { cookies } from "next/headers";

export type ChallengeSession = { currentChallenge?: string };

const MIN_PASSWORD_LENGTH = 32;

/**
 * The session that holds a WebAuthn challenge between the options request and its verification. The password comes
 * from `SESSION_PASSWORD`, which iron-session requires to be at least 32 characters; a missing or short one throws,
 * so the routes answer 500 instead of sealing the cookie with a weak key.
 */
export async function getChallengeSession(): Promise<
  IronSession<ChallengeSession>
> {
  const password = process.env.SESSION_PASSWORD;
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      "SESSION_PASSWORD is missing or shorter than 32 characters",
    );
  }
  return getIronSession<ChallengeSession>(await cookies(), {
    password,
    cookieName: "challenge",
  });
}
