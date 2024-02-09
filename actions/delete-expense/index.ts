"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { DeleteExpense } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: userClerkId } = auth();

  if (!userClerkId) {
    return { error: "Unauthorized" };
  }

  const { expenseId, groupId } = data;

  try {
    await db.expense.delete({
      where: { createrId: userClerkId, groupId, id: expenseId },
    });
    // expense = await db.expense.create({
    //   data: {
    //     amount,
    //     description,
    //     type,
    //     groupId,
    //     createrId,
    //     payments: {
    //       createMany: {
    //         data: payments.map((p) => ({ amount: p.amount, userId: p.userId })),
    //         // skipDuplicates: true,
    //       },
    //     },
    //     splits: {
    //       createMany: {
    //         data: splits.map((p) => ({ amount: p.amount, userId: p.userId })),
    //         // skipDuplicates: true,
    //       },
    //     },
    //   },
    // });
  } catch (error) {
    return { error: "Failed to create expense" };
  }

  revalidatePath(`/groups/${groupId || ""}`);
  revalidatePath(`/expense/add`);
  return { data: { message: "Deleted", groupId } };
};

export const deleteExpense = createSafeAction(DeleteExpense, handler);
