"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { CreateGroup } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { title, type } = data;

  let group;
  try {
    group = await db.group.create({ data: { title, type } });
  } catch (error) {
    return { error: "Failed to create group" };
  }

  revalidatePath(`/groups/add`);
  revalidatePath(`/groups/${group.id}`);
  return { data: group };
  //   redirect(`/groups/${group.id}`);
};

export const createGroup = createSafeAction(CreateGroup, handler);
