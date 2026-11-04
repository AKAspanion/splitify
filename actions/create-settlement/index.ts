"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { CreateSettlement } from "./schema";
import { APILogger } from "@/lib/logger";
import { areGroupMembers, isGroupMember } from "@/lib/auth/membership";
import { getActorName } from "@/lib/notification/actor";
import { settlementCreated } from "@/lib/notification/messages";
import { notifyAfterResponse } from "@/lib/notification/notify";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { amount, user1Id, user2Id, groupId } = data;

  let expense;
  let memberIds: string[] = [];
  let msg;
  try {
    if (!(await isGroupMember(userId, groupId))) {
      return { error: "Not found" };
    }
    if (!(await areGroupMembers(groupId, [user1Id, user2Id]))) {
      return { error: "Only members of this group can be added to an expense" };
    }

    const actorName = await getActorName(userId);
    const result = await db.$transaction(async (tx) => {
      const users = await tx.user.findMany({
        where: { id: { in: [user1Id, user2Id] } },
      });

      const user1 = users.find((u) => u.id === user1Id);
      const user2 = users.find((u) => u.id === user2Id);
      if (!user1 || !user2) return undefined;

      const description = `${user1?.firstName || user1?.name || "Someone"} paid ${user2?.firstName || user2?.name || "Someone"}`;

      const { group, ...created } = await tx.expense.create({
        data: {
          amount,
          groupId,
          description,
          type: "EXACT",
          createrId: userId,
          category: "settlement",
          tag: "SETTLEMENT",
          payments: {
            createMany: { data: [{ amount: amount, userId: user1.id }] },
          },
          splits: {
            createMany: { data: [{ amount: amount, userId: user2.id }] },
          },
        },
        include: {
          group: { select: { title: true, users: { select: { id: true } } } },
        },
      });
      const message = settlementCreated(actorName, { ...created, group });
      await tx.activity.create({
        data: {
          groupId,
          type: message.type,
          message: message.message,
          users: { connect: [{ id: userId }] },
        },
      });
      return {
        expense: created,
        memberIds: (group?.users ?? []).map((u) => u.id),
        msg: message,
      };
    });
    if (result) {
      ({ expense, memberIds, msg } = result);
    }
  } catch (error) {
    await APILogger.error("Failed to create settlement", {
      cause: error instanceof Error ? error.name : "Unknown",
    });
    return { error: "Failed to create settlement" };
  }

  if (msg) {
    notifyAfterResponse(memberIds, msg, userId);
  }
  revalidatePath(`/groups/${groupId || ""}`);
  return { data: { expense, userId, user1Id, user2Id } };
};

export const createSettlement = createSafeAction(CreateSettlement, handler);
