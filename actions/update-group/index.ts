"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { UpdateGroup } from "./schema";
import { getErrorMessage } from "@/utils/validate";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { title, type, description = "", groupId } = data;

  let group;
  try {
    group = await db.group.update({
      where: { id: groupId },
      data: { title, type, description },
    });
  } catch (error) {
    return {
      error: "Failed to update group",
      debugMessage: getErrorMessage(error).message,
    };
  }

  revalidatePath(`/groups/add`);
  revalidatePath(`/groups/${group.id}`);
  return { data: { group, userId } };
};

export const updateGroup = createSafeAction(UpdateGroup, handler);
