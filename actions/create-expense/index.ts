"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { CreateExpense } from "./schema";
import { getErrorMessage } from "@/utils/validate";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const {
    description,
    category,
    type,
    amount,
    splits,
    payments,
    groupId,
    createrId,
  } = data;

  let expense;
  try {
    expense = await db.expense.create({
      data: {
        amount,
        description,
        type,
        groupId,
        category,
        createrId,
        payments: {
          createMany: {
            data: payments.map((p) => ({ amount: p.amount, userId: p.userId })),
          },
        },
        splits: {
          createMany: {
            data: splits.map((p) => ({
              amount: p.amount,
              userId: p.userId,
              percent: p.percent,
            })),
          },
        },
      },
    });
  } catch (error) {
    return {
      error: "Failed to create expense",
      debugMessage: getErrorMessage(error).message,
    };
  }

  revalidatePath(`/groups/${groupId || ""}`);
  revalidatePath(`/expense/add`);
  return { data: expense };
};

export const createExpense = createSafeAction(CreateExpense, handler);
