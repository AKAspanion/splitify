"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { DeleteGroup } from "./schema";
import { getErrorMessage } from "@/utils/validate";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { groupId } = data;

  try {
    await db.group.delete({ where: { id: groupId } });
  } catch (error) {
    return {
      error: "Failed to delete expense",
      debugMessage: getErrorMessage(error).message,
    };
  }

  revalidatePath(`/groups`);
  return { data: { message: "Group deleted", groupId } };
};

export const deleteGroup = createSafeAction(DeleteGroup, handler);
