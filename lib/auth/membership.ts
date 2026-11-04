import { db } from "@/lib/db";

/** Whether the user belongs to the group, in one query. */
export async function isGroupMember(
  userId: string,
  groupId: string,
): Promise<boolean> {
  const count = await db.group.count({
    where: { id: groupId, users: { some: { id: userId } } },
  });
  return count > 0;
}

/** The group an expense belongs to, or null when the expense is unknown or in no group. */
export async function groupIdOfExpense(
  expenseId: string,
): Promise<string | null> {
  const expense = await db.expense.findUnique({
    where: { id: expenseId },
    select: { groupId: true },
  });
  return expense?.groupId ?? null;
}

/** True only when every distinct id is a member of the group; an empty list is true without a query. */
export async function areGroupMembers(
  groupId: string,
  userIds: string[],
): Promise<boolean> {
  const distinct = [...new Set(userIds)];
  if (distinct.length === 0) return true;
  const count = await db.user.count({
    where: { id: { in: distinct }, groups: { some: { id: groupId } } },
  });
  return count === distinct.length;
}

/** Whether `otherId` is in `userId`'s friends. */
export async function isFriendOf(
  userId: string,
  otherId: string,
): Promise<boolean> {
  const count = await db.user.count({
    where: { id: userId, friends: { some: { id: otherId } } },
  });
  return count > 0;
}
