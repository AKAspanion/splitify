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
 * Deletes each group whose only member is the person, with its expenses, payments, splits, members and activity:
 * nobody else's data is in it. Groups with other members stay.
 */
async function deleteSoleMemberGroups(userId: string): Promise<void> {
  const connector = getDataConnect(
    { serviceId: SERVICE, location: REGION, connector: "admin" },
    adminApp(),
  );
  const { data } = await connector.executeQuery<
    { groupMembers: { groupId: string; group: { members: unknown[] } }[] },
    { userId: string }
  >("ListUserGroupsWithMembers", { userId });
  for (const { groupId, group } of data.groupMembers) {
    if (group.members.length === 1)
      await connector.executeMutation("DeleteGroupAdmin", { id: groupId });
  }
}

/**
 * Deletes the groups only the person was in, replaces what identifies the person on their row, then removes the data that is theirs alone (push tokens,
 * feedback, devices, friendships) in one transaction. Memberships, expenses, payments and splits stay.
 * Safe to run twice: it sets the same values again.
 */
export async function anonymiseUser(userId: string): Promise<void> {
  const connector = getDataConnect(
    { serviceId: SERVICE, location: REGION, connector: "admin" },
    adminApp(),
  );
  await deleteSoleMemberGroups(userId);
  await connector.executeMutation("AnonymiseUser", {
    userId,
    name: DELETED_NAME,
    email: `${userId}@${DELETED_EMAIL_DOMAIN}`,
    imageUrl: PLACEHOLDER_AVATAR,
  });
  await connector.executeMutation("DeleteUserData", { userId });
}
