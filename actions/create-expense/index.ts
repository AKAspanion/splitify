"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { CreateExpense } from "./schema";
import { APILogger } from "@/lib/logger";
import { areGroupMembers, isGroupMember } from "@/lib/auth/membership";
import { getActorName } from "@/lib/notification/actor";
import { expenseCreated } from "@/lib/notification/messages";
import { notifyAfterResponse } from "@/lib/notification/notify";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const {
    category = "General",
    description,
    type,
    amount,
    splits,
    payments,
    groupId,
  } = data;

  let expense;
  let memberIds: string[];
  let msg;
  try {
    if (!(await isGroupMember(userId, groupId))) {
      return { error: "Not found" };
    }
    const involved = [...payments, ...splits].map((p) => p.userId);
    if (!(await areGroupMembers(groupId, involved))) {
      return { error: "Only members of this group can be added to an expense" };
    }

    const actorName = await getActorName(userId);
    ({ expense, memberIds, msg } = await db.$transaction(async (tx) => {
      // The creator is always the signed-in user; the input's createrId is ignored.
      const { group, ...created } = await tx.expense.create({
        data: {
          amount,
          description,
          type,
          groupId,
          category,
          createrId: userId,
          tag: "EXPENSE",
          payments: {
            createMany: {
              data: payments.map((p) => ({
                amount: p.amount,
                userId: p.userId,
              })),
            },
          },
          splits: {
            createMany: {
              data: splits.map((p) => ({
                amount: p.amount,
                userId: p.userId,
                percent: p.percent,
              })),
            },
          },
        },
        include: {
          group: { select: { title: true, users: { select: { id: true } } } },
        },
      });
      const message = expenseCreated(actorName, { ...created, group });
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
    }));
  } catch (error) {
    await APILogger.error("Failed to create expense", {
      cause: error instanceof Error ? error.name : "Unknown",
    });
    return { error: "Failed to create expense" };
  }

  notifyAfterResponse(memberIds, msg, userId);
  revalidatePath(`/groups/${groupId || ""}`);
  revalidatePath(`/expense/add`);
  return { data: { expense, userId } };
};

export const createExpense = createSafeAction(CreateExpense, handler);
