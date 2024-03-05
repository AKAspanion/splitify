"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { CreateContact } from "./schema";
import { getErrorMessage } from "@/utils/validate";
import { uid } from "uid";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { email, name } = data;

  let user;
  try {
    const id = `spuser_${uid(25)}`;
    user = await db.user.create({
      data: { email, name, id },
    });
  } catch (error) {
    return {
      error: "Failed to create contact",
      debugMessage: getErrorMessage(error).message,
    };
  }

  // revalidatePath(`/groups/add`);
  // revalidatePath(`/groups/${group.id}`);
  return { data: { user, userId } };
};

export const createContact = createSafeAction(CreateContact, handler);
