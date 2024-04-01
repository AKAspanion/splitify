"use server";

import { EXPENSE_PAGE_COUNT } from "@/constants/numbers";
import { db } from "@/lib/db";
import { getErrorMessage } from "@/utils/validate";
import { auth } from "@clerk/nextjs";

export const getExpenses = async (
  page = 1,
  groupId: string,
  queryText?: string,
) => {
  const { userId } = auth();

  if (!userId) {
    return {
      data: null,
      error: "Unauthorized",
      debugMessage: "No user id found",
    };
  }

  try {
    const skip = (page - 1) * EXPENSE_PAGE_COUNT;
    const take = page * EXPENSE_PAGE_COUNT;

    const [count, expenses] = await Promise.all([
      db.expense.count({
        where: { groupId, description: { contains: queryText } },
      }),
      db.expense.findMany({
        skip,
        take,
        where: { groupId, description: { contains: queryText } },
        orderBy: [{ createdAt: "desc" }],
      }),
    ]);

    return { data: { count, expenses }, error: null };
  } catch (err) {
    return {
      data: null,
      error: "Failed to get expenses",
      debugMessage: getErrorMessage(err).message,
    };
  }
};
