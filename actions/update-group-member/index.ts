"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { UpdateGroup } from "./schema";
import { APILogger } from "@/lib/logger";
import { isFriendOf, isGroupMember } from "@/lib/auth/membership";
import { memberAdded } from "@/lib/notification/messages";
import { notifyAfterResponse } from "@/lib/notification/notify";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { groupId, memberClerkId } = data;

  let group;
  let msg;
  try {
    if (!(await isGroupMember(userId, groupId))) {
      return { error: "Not found" };
    }
    if (!(await isFriendOf(userId, memberClerkId))) {
      return { error: "You can only add your friends to a group" };
    }

    ({ group, msg } = await db.$transaction(async (tx) => {
      const people = await tx.user.findMany({
        where: { id: { in: [userId, memberClerkId] } },
        select: { id: true, firstName: true, name: true },
      });
      const nameOf = (id: string) => {
        const person = people.find((p) => p.id === id);
        return person?.firstName || person?.name || "";
      };
      const updated = await tx.group.update({
        where: { id: groupId },
        data: { users: { connect: [{ id: memberClerkId }] } },
      });
      const message = memberAdded(
        nameOf(userId),
        nameOf(memberClerkId),
        updated,
      );
      await tx.activity.create({
        data: {
          groupId,
          type: message.type,
          message: message.message,
          users: { connect: [{ id: userId }] },
        },
      });
      return { group: updated, msg: message };
    }));
  } catch (error) {
    await APILogger.error("Failed to add group member", {
      cause: error instanceof Error ? error.name : "Unknown",
    });
    return { error: "Failed to add group member" };
  }

  notifyAfterResponse([memberClerkId, userId], msg, userId);
  revalidatePath(`/groups/add`);
  revalidatePath(`/groups/${group.id}`);
  revalidatePath(`/groups/${group.id}/settings`);
  revalidatePath(`/groups/${group.id}/add-member`);
  return { data: { groupId, userId, friendId: memberClerkId } };
};

export const updateGroupMember = createSafeAction(UpdateGroup, handler);
