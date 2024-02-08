"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { UpdateGroup } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: userClerkId } = auth();

  if (!userClerkId) {
    return { error: "Unauthorized" };
  }

  const { groupId, memberClerkId } = data;

  let group;
  try {
    group = await db.group.update({
      where: { id: groupId },
      data: {
        users: {
          connect: [{ clerk_id: memberClerkId }],
        },
      },
    });
  } catch (error) {
    return { error: "Failed to create group" };
  }

  revalidatePath(`/groups/add`);
  revalidatePath(`/groups/${group.id}`);
  revalidatePath(`/groups/${group.id}/settings`);
  revalidatePath(`/groups/${group.id}/add-member`);
  return { data: group };
};

export const updateGroupMember = createSafeAction(UpdateGroup, handler);
