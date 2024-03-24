"use server";

import { db } from "@/lib/db";
import { getErrorMessage } from "@/utils/validate";
import { auth } from "@clerk/nextjs";

export const getShare = async (expenseId: string, groupId: string) => {
  async function call() {
    const { userId } = auth();

    if (!userId) {
      return {
        data: null,
        error: "Unauthorized",
        debugMessage: "No user id found",
      };
    }

    try {
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
