"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/safe-actions";
import { AddFriend } from "./schema";
import { revalidatePath } from "next/cache";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: userClerkId } = auth();

  if (!userClerkId) {
    return { error: "Unauthorized" };
  }
  const { friendClerkId } = data;

  if (userClerkId === friendClerkId) {
    return { error: "You can't be friends with yourself" };
  }

  let user;
  try {
    await Promise.all([
      db.user.update({
        where: { clerk_id: userClerkId },
        data: { friends: { connect: [{ clerk_id: friendClerkId }] } },
      }),
      db.user.update({
        where: { clerk_id: friendClerkId },
        data: { friends: { connect: [{ clerk_id: userClerkId }] } },
      }),
    ]);
  } catch (error) {
    return { error: "Failed to create friendship" };
  }

  revalidatePath(`/friends/add`);
  return { data: user };
};

export const createFriend = createSafeAction(AddFriend, handler);
