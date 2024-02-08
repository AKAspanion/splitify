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

  const { description, amount, splits, payers } = data;

  console.log(description, amount, splits, payers);
  let expense;
  try {
    // group = await db.group.create({
    //   data: {
    //     title,
    //     type,
    //     users: {
    //       connect: [{ clerk_id: userClerkId }],
    //     },
    //   },
    // });
  } catch (error) {
    return { error: "Failed to create expense" };
  }

  revalidatePath(`/expense/add`);
  return { data: expense };
};

export const createExpense = createSafeAction(CreateExpense, handler);
