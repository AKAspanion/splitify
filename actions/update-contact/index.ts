"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { UpdateContact } from "./schema";
import { APILogger } from "@/lib/logger";
import { isFriendOf } from "@/lib/auth/membership";

const NOT_EDITABLE = "You can't edit this contact";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { email, name, id } = data;

  let user;
  try {
    // Only the caller's own friends, and never a person who signed up with Clerk, can be edited.
    if (!(await isFriendOf(userId, id))) {
      return { error: NOT_EDITABLE };
    }
    const target = await db.user.findUnique({
      where: { id },
      select: { fromClerk: true },
    });
    if (!target || target.fromClerk === true) {
      return { error: NOT_EDITABLE };
    }

    user = await db.user.update({
      where: { id },
      data: { email, name },
    });
  } catch (error) {
    await APILogger.error("Failed to update contact", {
      cause: error instanceof Error ? error.name : "Unknown",
    });
    return { error: "Failed to update contact" };
  }

  revalidatePath(`/friends`);
  revalidatePath(`/friends/${user.id}`);
  return { data: { user, userId } };
};

export const updateContact = createSafeAction(UpdateContact, handler);
