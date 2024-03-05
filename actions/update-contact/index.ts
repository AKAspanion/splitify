"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { UpdateContact } from "./schema";
import { getErrorMessage } from "@/utils/validate";
import { uid } from "uid";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { email, name, id } = data;

  let user;
  try {
    user = await db.user.update({
      where: { id: id || "null" },
      data: { email, name },
    });
  } catch (error) {
    return {
      error: "Failed to create contact",
      debugMessage: getErrorMessage(error).message,
    };
  }

  revalidatePath(`/friends`);
  revalidatePath(`/friends/${user.id}`);
  return { data: { user, userId } };
};

export const updateContact = createSafeAction(UpdateContact, handler);
