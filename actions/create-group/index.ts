"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { CreateGroup } from "./schema";
import { APILogger } from "@/lib/logger";
import { getActorName } from "@/lib/notification/actor";
import { groupCreated } from "@/lib/notification/messages";
import { notifyAfterResponse } from "@/lib/notification/notify";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { title, type, description, image_url } = data;

  let group;
  let msg;
  try {
    const actorName = await getActorName(userId);
    ({ group, msg } = await db.$transaction(async (tx) => {
      const created = await tx.group.create({
        data: {
          type,
          title,
          image_url,
          description,
          users: { connect: [{ id: userId }] },
        },
      });
      const message = groupCreated(actorName, created);
      await tx.activity.create({
        data: {
          groupId: created.id,
          type: message.type,
          message: message.message,
          users: { connect: [{ id: userId }] },
        },
      });
      return { group: created, msg: message };
    }));
  } catch (error) {
    await APILogger.error("Failed to create group", {
      cause: error instanceof Error ? error.name : "Unknown",
    });
    return { error: "Failed to create group" };
  }

  notifyAfterResponse([userId], msg, userId);
  revalidatePath(`/groups/add`);
  revalidatePath(`/groups/${group.id}`);
  return { data: { group, userId } };
};

export const createGroup = createSafeAction(CreateGroup, handler);
