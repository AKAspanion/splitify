"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { DeleteExpense } from "./schema";
import { APILogger } from "@/lib/logger";
import { groupIdOfExpense, isGroupMember } from "@/lib/auth/membership";
import { getActorName } from "@/lib/notification/actor";
import { expenseDeleted } from "@/lib/notification/messages";
import { notifyAfterResponse } from "@/lib/notification/notify";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { expenseId } = data;

  let groupId: string | null;
  let expense;
  let memberIds: string[];
  let msg;
  try {
    // The expense's own group decides, not the groupId the client sent.
    groupId = await groupIdOfExpense(expenseId);
    if (!groupId || !(await isGroupMember(userId, groupId))) {
      return { error: "Not found" };
    }
    const activityGroupId = groupId;

    const actorName = await getActorName(userId);
    ({ expense, memberIds, msg } = await db.$transaction(async (tx) => {
      const { group, ...deleted } = await tx.expense.delete({
        where: { id: expenseId },
        include: {
          group: { select: { title: true, users: { select: { id: true } } } },
        },
      });
      const message = expenseDeleted(actorName, { ...deleted, group });
      await tx.activity.create({
        data: {
          groupId: activityGroupId,
          type: message.type,
          message: message.message,
          users: { connect: [{ id: userId }] },
        },
      });
      return {
        expense: deleted,
        memberIds: (group?.users ?? []).map((u) => u.id),
        msg: message,
      };
    }));
  } catch (error) {
    await APILogger.error("Failed to delete expense", {
      cause: error instanceof Error ? error.name : "Unknown",
    });
    return { error: "Failed to delete expense" };
  }

  notifyAfterResponse(memberIds, msg, userId);
  revalidatePath(`/groups/${groupId || ""}`);
  revalidatePath(`/expense/add`);
  return {
    data: {
      message: "Deleted",
      groupId: groupId || undefined,
      userId,
      expenseTag: expense?.tag || "",
      expenseDesc: expense?.description || "",
    },
  };
};

export const deleteExpense = createSafeAction(DeleteExpense, handler);
