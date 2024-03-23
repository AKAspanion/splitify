"use server";

import { db } from "@/lib/db";
import { getErrorMessage } from "@/utils/validate";
import { auth } from "@clerk/nextjs";

export const getWhoPaid = async (expenseId: string) => {
  const { userId } = auth();

  if (!userId) {
    return {
      data: null,
      error: "Unauthorized",
      debugMessage: "No user id found",
    };
  }

  try {
    const payments = await db.userPayment.findMany({
      where: { expenseId: expenseId || "null" },
      include: { user: true },
    });

    return { data: { payments }, error: null };
  } catch (err) {
    return {
      data: null,
      error: "Failed to get share",
      debugMessage: getErrorMessage(err).message,
    };
  }
};
