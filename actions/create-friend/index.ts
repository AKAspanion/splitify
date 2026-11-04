"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/safe-actions";
import { AddFriend } from "./schema";
import { revalidatePath } from "next/cache";
import { APILogger } from "@/lib/logger";
import { isGroupMember } from "@/lib/auth/membership";
import { memberAdded, ActivityMessage } from "@/lib/notification/messages";
import { notifyAfterResponse } from "@/lib/notification/notify";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }
  const { friendId, groupId } = data;

  if (userId === friendId) {
    return { error: "You can't be friends with yourself" };
  }

  let msg: ActivityMessage | undefined;
  try {
    if (groupId && !(await isGroupMember(userId, groupId))) {
      return { error: "Not found" };
    }

    msg = await db.$transaction(async (tx) => {
      const me = await tx.user.update({
        where: { id: userId },
        data: { friends: { connect: [{ id: friendId }] } },
      });
      const friend = await tx.user.update({
        where: { id: friendId },
        data: { friends: { connect: [{ id: userId }] } },
      });
      if (!groupId) return undefined;

      const group = await tx.group.update({
        where: { id: groupId },
        data: { users: { connect: [{ id: friendId }] } },
      });
      const message = memberAdded(
        me.firstName || me.name || "",
        friend.firstName || friend.name || "",
        group,
      );
      await tx.activity.create({
        data: {
          groupId,
          type: message.type,
          message: message.message,
          users: { connect: [{ id: userId }] },
        },
      });
      return message;
    });
  } catch (error) {
    await APILogger.error("Failed to create friendship", {
      cause: error instanceof Error ? error.name : "Unknown",
    });
    return { error: "Failed to create friendship" };
  }

  // Without a group there is no activity to record (it needs a group) and no push, as before.
  if (msg) {
    notifyAfterResponse([friendId, userId], msg, userId);
  }
  revalidatePath(`/friends/add`);
  revalidatePath(`/friends`);
  if (groupId) {
    revalidatePath(`/groups/add`);
    revalidatePath(`/groups/${groupId}`);
    revalidatePath(`/groups/${groupId}/settings`);
    revalidatePath(`/groups/${groupId}/add-member`);
  }
  return {
    data: {
      message: "Friend added successfully",
      userId,
      friendId,
    },
  };
};

export const createFriend = createSafeAction(AddFriend, handler);
