"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { UpdateExpense } from "./schema";
import { getErrorMessage } from "@/utils/validate";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { description, id } = data;

  let expense;
  try {
    expense = await db.expense.update({
      where: { id },
      data: { description },
    });
  } catch (error) {
    return {
      error: "Failed to update expense",
      debugMessage: getErrorMessage(error).message,
    };
  }

  revalidatePath(`/expense/${id}/edit`);
  revalidatePath(`/group/${expense?.groupId || ""}/`);
  revalidatePath(`/group/${expense?.groupId || ""}/${id}/${expense?.id || ""}`);
  return { data: { expense, userId } };
};

export const updateExpense = createSafeAction(UpdateExpense, handler);
