"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { CreateExpense } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: userClerkId } = auth();

  if (!userClerkId) {
    return { error: "Unauthorized" };
  }

  const { description, type, amount, splits, payments, groupId, createrId } =
    data;

  let expense;
  try {
    expense = await db.expense.create({
      data: {
        amount,
        description,
        type,
        groupId,
        createrId,
        payments: {
          createMany: {
            data: payments.map((p) => ({ amount: p.amount, userId: p.userId })),
          },
        },
        splits: {
          createMany: {
            data: splits.map((p) => ({ amount: p.amount, userId: p.userId })),
          },
        },
      },
    });
  } catch (error) {
    return { error: "Failed to create expense" };
  }

  revalidatePath(`/groups/${groupId || ""}`);
  revalidatePath(`/expense/add`);
  return { data: expense };
};

export const createExpense = createSafeAction(CreateExpense, handler);
