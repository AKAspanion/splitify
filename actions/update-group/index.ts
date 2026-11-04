"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { UpdateGroup } from "./schema";
import { APILogger } from "@/lib/logger";
import { isGroupMember } from "@/lib/auth/membership";
import { getActorName } from "@/lib/notification/actor";
import { groupUpdated } from "@/lib/notification/messages";
import { notifyAfterResponse } from "@/lib/notification/notify";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { title, type, description = "", groupId } = data;

  let group;
  let msg;
  try {
    if (!(await isGroupMember(userId, groupId))) {
      return { error: "Not found" };
    }

    const actorName = await getActorName(userId);
    ({ group, msg } = await db.$transaction(async (tx) => {
      const updated = await tx.group.update({
        where: { id: groupId },
        data: { title, type, description },
      });
      const message = groupUpdated(actorName, updated);
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
    await APILogger.error("Failed to update group", {
      cause: error instanceof Error ? error.name : "Unknown",
    });
    return { error: "Failed to update group" };
  }

  notifyAfterResponse([userId], msg, userId);
  revalidatePath(`/groups/add`);
  revalidatePath(`/groups/${group.id}`);
  return { data: { group, userId } };
};

export const updateGroup = createSafeAction(UpdateGroup, handler);
