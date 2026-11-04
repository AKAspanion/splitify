"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { DeleteGroup } from "./schema";
import { APILogger } from "@/lib/logger";
import { getActorName } from "@/lib/notification/actor";
import { groupDeleted } from "@/lib/notification/messages";
import { notifyAfterResponse } from "@/lib/notification/notify";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { groupId } = data;
  let groupName = "";
  let msg;
  try {
    // The membership check is part of the lookup, so a non-member sees the same answer as a missing group.
    const existing = await db.group.findFirst({
      where: { id: groupId, users: { some: { id: userId } } },
      select: { title: true },
    });
    if (!existing) {
      return { error: "Not found" };
    }

    const actorName = await getActorName(userId);
    groupName = existing.title || "";
    const message = groupDeleted(actorName, groupName);
    msg = message;
    await db.$transaction(async (tx) => {
      await tx.group.delete({ where: { id: groupId } });
      await tx.activity.create({
        data: {
          groupId,
          type: message.type,
          message: message.message,
          users: { connect: [{ id: userId }] },
        },
      });
    });
  } catch (error) {
    await APILogger.error("Failed to delete group", {
      cause: error instanceof Error ? error.name : "Unknown",
    });
    return { error: "Failed to delete group" };
  }

  notifyAfterResponse([userId], msg, userId);
  revalidatePath(`/groups`);
  return {
    data: { message: "Group deleted", groupName, groupId, userId },
  };
};

export const deleteGroup = createSafeAction(DeleteGroup, handler);
