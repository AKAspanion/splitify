"use server";

import { isGroupMember } from "@/lib/auth/membership";
import { db } from "@/lib/db";
import { getErrorMessage } from "@/utils/validate";
import { auth } from "@clerk/nextjs/server";

export const getGroupUsers = async (id: string) => {
  const { userId } = await auth();

  if (!userId) {
    return {
      data: null,
      error: "Unauthorized",
      debugMessage: "No user id found",
    };
  }

  try {
    if (!(await isGroupMember(userId, id))) {
      return { data: null, error: "Not found", debugMessage: "Not a member" };
    }

    const users = await db.user.findMany({
      where: { groups: { some: { id: id || "null" } } },
    });

    return { data: users, error: null };
  } catch (err) {
    return {
      data: null,
      error: "Failed to get group",
      debugMessage: getErrorMessage(err).message,
    };
  }
};
