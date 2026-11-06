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

/** How recently the caller must have signed in, so a stolen or left-open session can't delete the account. */
const RECENT_SIGN_IN_SECONDS = 300;
const SIGN_IN_AGAIN_TO_DELETE = "Sign in again to delete your account.";

/** Whether the ID token's `auth_time` (seconds since the epoch, set by Firebase Auth) is within the last 5 minutes. */
function signedInRecently(authTime: unknown): boolean {
  if (typeof authTime !== "number" || !Number.isFinite(authTime)) return false;
  return Date.now() / 1000 - authTime <= RECENT_SIGN_IN_SECONDS;
}

/**
 * Deletes the caller's account: revokes their refresh tokens, anonymises their row and removes their own data, then
 * deletes their Firebase Auth user. In that order, so a failure on the Auth user leaves the anonymisation in place and
 * a second call finishes. Only a caller who signed in within the last 5 minutes may do it.
 */
export const deleteMyAccount = onCall(
  { region: "asia-south1" },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to continue.");
    if (!signedInRecently(request.auth?.token.auth_time)) {
      logger.warn("deleteMyAccount refused", { reason: "stale-sign-in" });
      throw new HttpsError("unauthenticated", SIGN_IN_AGAIN_TO_DELETE);
    }

    // Every session the caller has ends here, so none can act while the rest is deleted.
    try {
      await getAuth(adminApp()).revokeRefreshTokens(uid);
    } catch (error) {
      // A first call that deleted the Auth user already ended its sessions.
      if ((error as { code?: unknown }).code !== "auth/user-not-found") {
        logger.error("deleteMyAccount failed", {
          operation: "revokeRefreshTokens",
          cause: causeClass(error),
        });
        throw new HttpsError("internal", FAILED);
      }
    }

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
