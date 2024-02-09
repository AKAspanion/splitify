"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { CreateGroup } from "./schema";
import { getErrorMessage } from "@/utils/validate";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { title, type } = data;

  let group;
  try {
    group = await db.group.create({
      data: { title, type, users: { connect: [{ id: userId }] } },
    });
  } catch (error) {
    return {
      error: "Failed to create group",
      debugMessage: getErrorMessage(error).message,
    };
  }

  revalidatePath(`/groups/add`);
  revalidatePath(`/groups/${group.id}`);
  return { data: group };
};

export const createGroup = createSafeAction(CreateGroup, handler);
