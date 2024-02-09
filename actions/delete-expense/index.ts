"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { DeleteExpense } from "./schema";
import { getErrorMessage } from "@/utils/validate";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { expenseId, groupId } = data;

  try {
    await db.expense.delete({ where: { groupId, id: expenseId } });
  } catch (error) {
    return {
      error: "Failed to delete expense",
      debugMessage: getErrorMessage(error).message,
    };
  }

  revalidatePath(`/groups/${groupId || ""}`);
  revalidatePath(`/expense/add`);
  return { data: { message: "Deleted", groupId } };
};

export const deleteExpense = createSafeAction(DeleteExpense, handler);
