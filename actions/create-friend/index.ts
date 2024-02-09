"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/safe-actions";
import { AddFriend } from "./schema";
import { revalidatePath } from "next/cache";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }
  const { friendClerkId } = data;

  if (userId === friendClerkId) {
    return { error: "You can't be friends with yourself" };
  }

  let user;
  try {
    await Promise.all([
      db.user.update({
        where: { id: userId },
        data: { friends: { connect: [{ id: friendClerkId }] } },
      }),
      db.user.update({
        where: { id: friendClerkId },
        data: { friends: { connect: [{ id: userId }] } },
      }),
    ]);
  } catch (error) {
    return { error: "Failed to create friendship" };
  }

  revalidatePath(`/friends/add`);
  revalidatePath(`/friends`);
  return { data: user };
};

export const createFriend = createSafeAction(AddFriend, handler);
