"use server";

import { isGroupMember } from "@/lib/auth/membership";
import { db } from "@/lib/db";
import { getErrorMessage } from "@/utils/validate";
import { auth } from "@clerk/nextjs/server";

export const getShare = async (expenseId: string, groupId: string) => {
  async function call() {
    const { userId } = await auth();

    if (!userId) {
      return {
        data: null,
        error: "Unauthorized",
        debugMessage: "No user id found",
      };
    }

    try {
      const expense = await db.expense.findFirst({
        where: { id: expenseId, groupId },
        select: { id: true },
      });
      if (!expense || !(await isGroupMember(userId, groupId))) {
        return { data: null, error: "Not found", debugMessage: "Not a member" };
      }

      const [users, payments, splits] = await db.$transaction([
        db.user.findMany({
          where: { groups: { some: { id: groupId || "null" } } },
        }),
        db.userPayment.findMany({ where: { expenseId } }),
        db.userSplit.findMany({ where: { expenseId } }),
      ]);

      return { data: { users, payments, splits }, error: null };
    } catch (err) {
      return {
        data: null,
        error: "Failed to get share",
        debugMessage: getErrorMessage(err).message,
      };
    }
  }

  return { promise: call() };
};
