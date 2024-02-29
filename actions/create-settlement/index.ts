"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { CreateSettlement } from "./schema";
import { getErrorMessage } from "@/utils/validate";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { amount, user1Id, user2Id, groupId } = data;

  let expense;
  try {
    const users = await db.user.findMany({
      where: { id: { in: [user1Id, user2Id] } },
    });

    const user1 = users.find((u) => u.id === user1Id);
    const user2 = users.find((u) => u.id === user2Id);
    if (user1 && user2) {
      const description = `${user1?.firstName || user1?.name || "Someone"} paid ${user2?.firstName || user2?.name || "Someone"}`;

      expense = await db.expense.create({
        data: {
          amount,
          groupId,
          description,
          type: "EXACT",
          createrId: userId,
          category: "settlement",
          tag: "SETTLEMENT",
          payments: {
            createMany: { data: [{ amount: amount, userId: user1?.id }] },
          },
          splits: {
            createMany: { data: [{ amount: amount, userId: user2?.id }] },
          },
        },
      });
    }
  } catch (error) {
    return {
      error: "Failed to create settlement",
      debugMessage: getErrorMessage(error).message,
    };
  }

  revalidatePath(`/groups/${groupId || ""}`);
  return { data: { expense, userId, user1Id, user2Id } };
};

export const createSettlement = createSafeAction(CreateSettlement, handler);
