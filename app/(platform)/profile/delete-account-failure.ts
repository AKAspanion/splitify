import { toUserMessage } from "@/lib/data/errors";

/** deleteMyAccount's answer to a sign-in older than 5 minutes (functions/src/account/delete-my-account.ts). */
const SIGN_IN_AGAIN_TO_DELETE = "Sign in again to delete your account.";

/** The callable SDK's code for the function's HTTP 401 (`HttpsError("unauthenticated", …)`). */
const UNAUTHENTICATED_CODES = ["functions/unauthenticated", "unauthenticated"];

/** Where someone goes to sign in again, and from there back to Profile to finish deleting their account. */
export const SIGN_IN_AGAIN_PATH = "/sign-in/?next=/profile/";

export type DeleteAccountFailure = {
  /** The toast's text. */
  message: string;
  /** Whether to sign the person out and send them to sign in again, so they can finish. */
  signInAgain: boolean;
};

const readField = (error: unknown, key: "code" | "message"): string => {
  if (typeof error !== "object" || error === null) return "";
  const value = (error as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
};

/**
 * What the Profile screen does when deleteMyAccount fails. Only the function's 401 for a sign-in that is too old sends
 * the person to sign in again; any other failure is a toast and they stay.
 */
export function deleteAccountFailure(error: unknown): DeleteAccountFailure {
  const signInAgain =
    UNAUTHENTICATED_CODES.includes(readField(error, "code")) &&
    readField(error, "message").includes(SIGN_IN_AGAIN_TO_DELETE);
  return { message: toUserMessage(error), signInAgain };
}
