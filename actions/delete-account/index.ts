"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/safe-actions";
import { DeleteAccount } from "./schema";
import { APILogger } from "@/lib/logger";
import { anonymiseUser } from "@/lib/account/anonymise";
import { deleteOneSignalUser } from "@/lib/onesignal";

const handler = async (data: InputType): Promise<ReturnType> => {
  // The input is ignored: a person can only delete the account of their own session.
  void data;
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  try {
    let row = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!row) {
      // A merged contact keeps its own id; the Clerk account's email finds it.
      const email = (await currentUser())?.primaryEmailAddress?.emailAddress;
      if (email) {
        row = await db.user.findUnique({
          where: { email },
          select: { id: true },
        });
      }
    }

    await db.$transaction(
      async (tx) => {
        if (row) {
          await anonymiseUser(tx, row.id);
        }
        // Last, so that a refusal from Clerk rolls the anonymisation back.
        await (await clerkClient()).users.deleteUser(userId);
      },
      { timeout: 15000 },
    );
  } catch (error) {
    await APILogger.error("Failed to delete account", {
      cause: error instanceof Error ? error.name : "Unknown",
    });
    return { error: "Couldn't delete your account. Try again." };
  }

  const oneSignal = await deleteOneSignalUser(userId);
  if (!oneSignal.ok) {
    await APILogger.error(
      "Failed to delete OneSignal user after account deletion",
    );
  }

  return { data: { deleted: true } };
};

export const deleteAccount = createSafeAction(DeleteAccount, handler);
