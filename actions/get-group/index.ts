"use server";

import { db } from "@/lib/db";
import { getErrorMessage } from "@/utils/validate";
import { auth } from "@clerk/nextjs";

export const getGroup = async (id: string) => {
  const { userId } = auth();

  if (!userId) {
    return {
      data: null,
      error: "Unauthorized",
      debugMessage: "No user id found",
    };
  }

  try {
    const group = await db.group.findUnique({
      where: { id, users: { some: { id: userId || "null" } } },
    });

    return { data: group, error: null };
  } catch (err) {
    return {
      data: null,
      error: "Failed to get group",
      debugMessage: getErrorMessage(err).message,
    };
  }
};
