import { getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDataConnect } from "firebase-admin/data-connect";
import { onMutationExecuted } from "firebase-functions/dataconnect";
import * as logger from "firebase-functions/logger";

const REGION = "asia-south1";
const SERVICE = "splitify";
const ADMIN_APP = "merge-contact";

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

/**
 * Merges the contact that has this person's email into their account: the contact's rows move to `uid` and the
 * contact is deleted. Runs only for a verified email, since anybody can sign up with an address they do not own.
 * `"none"` when there is no contact (this includes a merge that already ran).
 */
export async function mergeContactForUser(
  uid: string,
): Promise<"merged" | "none" | "unverified"> {
  try {
    const user = await getAuth(adminApp()).getUser(uid);
    if (!user.emailVerified || !user.email) return "unverified";

    const connector = adminConnector();
    const found = await connector.executeQuery<
      { users: { id: string }[] },
      { email: string; notId: string }
    >("FindContactByEmail", { email: user.email.toLowerCase(), notId: uid });
    const contact = found.data.users[0];
    if (!contact) return "none";

    await connector.executeMutation("MergeContactIntoUser", {
      contactId: contact.id,
      userId: uid,
    });
    return "merged";
  } catch (error) {
    logger.error("mergeContactForUser failed", {
      operation: "MergeContactIntoUser",
      cause: causeClass(error),
    });
    throw error;
  }
}

/** Runs after every `UpsertMe`, so a person who verifies their email later is merged at their next sign-in. */
export const mergeContactOnSignUp = onMutationExecuted(
  {
    service: SERVICE,
    connector: "app",
    operation: "UpsertMe",
    region: REGION,
  },
  async (event) => {
    const uid = event.authId;
    if (!uid) return;
    try {
      const result = await mergeContactForUser(uid);
      logger.info("mergeContactOnSignUp finished", {
        operation: "UpsertMe",
        result,
      });
    } catch {
      // mergeContactForUser has logged the operation and the cause class already.
    }
  },
);
