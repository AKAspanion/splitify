import { join } from "@prisma/client/runtime/client";
import { db } from "@/lib/db";

export const DELETED_NAME = "Deleted user";
export const DELETED_EMAIL_DOMAIN = "deleted.invalid";
export const PLACEHOLDER_AVATAR = "/images/placeholder/avatar.jpeg";

/** The client Prisma passes to an interactive `db.$transaction(async (tx) => …)` callback. */
export type TransactionClient = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

/**
 * Removes what identifies a person and keeps their shared expenses.
 * Safe to run twice. Returns `anonymised: false` only for a missing or already anonymised row;
 * any query error rejects, so the caller's transaction rolls back and the caller decides what to log.
 */
export async function anonymiseUser(
  tx: TransactionClient,
  userId: string,
): Promise<{ anonymised: boolean }> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      groups: { select: { id: true, _count: { select: { users: true } } } },
    },
  });
  if (!user || user.email.endsWith(`@${DELETED_EMAIL_DOMAIN}`)) {
    return { anonymised: false };
  }

  // A group with nobody else in it holds nobody else's data.
  const soloGroupIds = user.groups
    .filter((g) => g._count.users <= 1)
    .map((g) => g.id);
  const keptGroupIds = user.groups
    .filter((g) => g._count.users > 1)
    .map((g) => g.id);

  if (soloGroupIds.length > 0) {
    await tx.group.deleteMany({ where: { id: { in: soloGroupIds } } });
  }

  const name = user.name?.trim() ? user.name : null;
  if (name && keptGroupIds.length > 0) {
    await tx.$executeRaw`UPDATE Activity SET message = REPLACE(message, ${name}, ${DELETED_NAME}) WHERE groupId IN (${join(keptGroupIds)})`;
  }

  await tx.authnDevice.deleteMany({ where: { userId } });
  await tx.feedback.deleteMany({ where: { userId } });

  await tx.user.update({
    where: { id: userId },
    data: {
      name: DELETED_NAME,
      firstName: "Deleted",
      lastName: "user",
      email: `deleted-${userId}@${DELETED_EMAIL_DOMAIN}`,
      image_url: PLACEHOLDER_AVATAR,
      profile_image_url: PLACEHOLDER_AVATAR,
      fromClerk: false,
      friends: { set: [] },
      symmetricFriends: { set: [] },
    },
  });
  return { anonymised: true };
}
