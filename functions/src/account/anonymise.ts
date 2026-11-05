import { getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getDataConnect } from "firebase-admin/data-connect";

// The rule is decisions/anonymise-deleted-accounts: the row stays, what identifies the person goes.
export const DELETED_NAME = "Deleted user";
export const DELETED_EMAIL_DOMAIN = "deleted.invalid";
export const PLACEHOLDER_AVATAR = "/images/placeholder/avatar.jpeg";

const REGION = "asia-south1";
const SERVICE = "splitify";
const ADMIN_APP = "delete-my-account";

/** The Firebase app the callable uses for the admin connector and for deleting the Auth user. */
export function adminApp(): App {
  return getApps().some((a) => a.name === ADMIN_APP)
    ? getApp(ADMIN_APP)
    : initializeApp({}, ADMIN_APP);
}

/**
 * Replaces what identifies the person on their row, then removes the data that is theirs alone (push tokens,
 * feedback, devices, friendships) in one transaction. Memberships, expenses, payments and splits stay.
 * Safe to run twice: it sets the same values again.
 */
export async function anonymiseUser(userId: string): Promise<void> {
  const connector = getDataConnect(
    { serviceId: SERVICE, location: REGION, connector: "admin" },
    adminApp(),
  );
  await connector.executeMutation("AnonymiseUser", {
    userId,
    name: DELETED_NAME,
    email: `${userId}@${DELETED_EMAIL_DOMAIN}`,
    imageUrl: PLACEHOLDER_AVATAR,
  });
  await connector.executeMutation("DeleteUserData", { userId });
}
