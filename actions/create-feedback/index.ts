"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { CreateFeedback } from "./schema";
import { getErrorMessage } from "@/utils/validate";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { title, description } = data;

  let feedback;
  try {
    feedback = await db.feedback.create({
      data: { title, description, userId },
    });
  } catch (error) {
    return {
      error: "Failed to create feedback",
      debugMessage: getErrorMessage(error).message,
    };
  }

  revalidatePath(`/feedback/add`);
  return { data: { feedback, userId } };
};

export const createFeedback = createSafeAction(CreateFeedback, handler);
