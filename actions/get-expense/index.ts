"use server";

import { db } from "@/lib/db";
import { getErrorMessage } from "@/utils/validate";
import { auth } from "@clerk/nextjs/server";

export const getExpense = async (
  expenseId: string,
  groupId: string,
  user = true,
) => {
  const { userId } = await auth();

  if (!userId) {
    return {
      data: null,
      error: "Unauthorized",
      debugMessage: "No user id found",
    };
  }

  try {
    const expense = await db.expense.findUnique({
      where: { id: expenseId, groupId },
      include: { user },
    });

    return { data: expense, error: null };
  } catch (err) {
    return {
      data: null,
      error: "Failed to get expense",
      debugMessage: getErrorMessage(err).message,
    };
  }
};
