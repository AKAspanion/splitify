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
  const { friendId, groupId } = data;

  if (userId === friendId) {
    return { error: "You can't be friends with yourself" };
  }
  console.log(groupId);

  try {
    const promises: any[] = [
      db.user.update({
        where: { id: userId },
        data: { friends: { connect: [{ id: friendId }] } },
      }),
      db.user.update({
        where: { id: friendId },
        data: { friends: { connect: [{ id: userId }] } },
      }),
    ];

    if (groupId) {
      promises.push(
        db.group.update({
          where: { id: groupId },
          data: { users: { connect: [{ id: friendId }] } },
        })
      );
    }
    await Promise.all(promises);
  } catch (error) {
    return {
      error: "Failed to create friendship",
      debugMessage: getErrorMessage(error).message,
    };
  }

  revalidatePath(`/friends/add`);
  revalidatePath(`/friends`);
  if (groupId) {
    revalidatePath(`/groups/add`);
    revalidatePath(`/groups/${groupId}`);
    revalidatePath(`/groups/${groupId}/settings`);
    revalidatePath(`/groups/${groupId}/add-member`);
  }
  return { data: { message: "Friend added successfully" } };
};

export const createFriend = createSafeAction(AddFriend, handler);
