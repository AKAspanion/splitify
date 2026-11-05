import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { adminApp, anonymiseUser } from "./anonymise";

/** The class of an error, for logs: never its message, which can hold an email or a query. */
function causeClass(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string"
      ? `${error.constructor.name}:${code}`
      : error.constructor.name;
  }
  return typeof error;
}

const FAILED = "Couldn't delete your account. Try again.";

/**
 * Deletes the caller's account: anonymises their row and removes their own data first, then their Firebase Auth
 * user. In that order, so a failure on the Auth user leaves the anonymisation in place and a second call finishes.
 */
export const deleteMyAccount = onCall(
  { region: "asia-south1" },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to continue.");

    try {
      await anonymiseUser(uid);
    } catch (error) {
      logger.error("deleteMyAccount failed", {
        operation: "anonymiseUser",
        cause: causeClass(error),
      });
      throw new HttpsError("internal", FAILED);
    }

    try {
      await getAuth(adminApp()).deleteUser(uid);
    } catch (error) {
      // A first call that got this far already removed the Auth user: there is nothing left to delete.
      if ((error as { code?: unknown }).code !== "auth/user-not-found") {
        logger.error("deleteMyAccount failed", {
          operation: "deleteUser",
          cause: causeClass(error),
        });
        throw new HttpsError("internal", FAILED);
      }
    }
    return { ok: true as const };
  },
);
