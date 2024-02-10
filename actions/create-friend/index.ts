"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/safe-actions";
import { AddFriend } from "./schema";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/utils/validate";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }
  const { friendId } = data;

  if (userId === friendId) {
    return { error: "You can't be friends with yourself" };
  }

  try {
    await Promise.all([
      db.user.update({
        where: { id: userId },
        data: { friends: { connect: [{ id: friendId }] } },
      }),
      db.user.update({
        where: { id: friendId },
        data: { friends: { connect: [{ id: userId }] } },
      }),
    ]);
  } catch (error) {
    return {
      error: "Failed to create friendship",
      debugMessage: getErrorMessage(error).message,
    };
  }

  revalidatePath(`/friends/add`);
  revalidatePath(`/friends`);
  return { data: { message: "Friend added successfully" } };
};

export const createFriend = createSafeAction(AddFriend, handler);
