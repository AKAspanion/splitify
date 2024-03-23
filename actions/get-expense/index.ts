"use server";

import { db } from "@/lib/db";
import { getErrorMessage } from "@/utils/validate";
import { auth } from "@clerk/nextjs";

const PAGE_COUNT = 8;
export const getExpenses = async (page = 1, groupId: string) => {
  const { userId } = auth();

  if (!userId) {
    return {
      data: null,
      error: "Unauthorized",
      debugMessage: "No user id found",
    };
  }

  try {
    const skip = (page - 1) * PAGE_COUNT;
    const take = page * PAGE_COUNT;
    const expenses = await db.expense.findMany({
      skip,
      take,
      where: { groupId },
      orderBy: [{ createdAt: "desc" }],
    });

    return { data: expenses, error: null };
  } catch (err) {
    return {
      data: null,
      error: "Failed to get expenses",
      debugMessage: getErrorMessage(err).message,
    };
  }
};
