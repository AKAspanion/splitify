"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { UpdateExpense } from "./schema";
import { APILogger } from "@/lib/logger";
import { groupIdOfExpense, isGroupMember } from "@/lib/auth/membership";
import { getActorName } from "@/lib/notification/actor";
import { expenseUpdated } from "@/lib/notification/messages";
import { notifyAfterResponse } from "@/lib/notification/notify";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { description, id } = data;

  let expense;
  let memberIds: string[];
  let msg;
  try {
    const groupId = await groupIdOfExpense(id);
    if (!groupId || !(await isGroupMember(userId, groupId))) {
      return { error: "Not found" };
    }

    const actorName = await getActorName(userId);
    ({ expense, memberIds, msg } = await db.$transaction(async (tx) => {
      const { group, ...updated } = await tx.expense.update({
        where: { id },
        data: { description },
        include: {
          group: { select: { title: true, users: { select: { id: true } } } },
        },
      });
      const message = expenseUpdated(actorName, { ...updated, group });
      await tx.activity.create({
        data: {
          groupId,
          type: message.type,
          message: message.message,
          users: { connect: [{ id: userId }] },
        },
      });
      return {
        expense: updated,
        memberIds: (group?.users ?? []).map((u) => u.id),
        msg: message,
      };
    }));
  } catch (error) {
    await APILogger.error("Failed to update expense", {
      cause: error instanceof Error ? error.name : "Unknown",
    });
    return { error: "Failed to update expense" };
  }

  notifyAfterResponse(memberIds, msg, userId);
  revalidatePath(`/expense/${id}/edit`);
  revalidatePath(`/group/${expense?.groupId || ""}/`);
  revalidatePath(`/group/${expense?.groupId || ""}/${id}/${expense?.id || ""}`);
  return { data: { expense, userId } };
};

export const updateExpense = createSafeAction(UpdateExpense, handler);
