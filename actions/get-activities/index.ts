"use server";

import { ACTIVITY_PAGE_COUNT } from "@/constants/numbers";
import { db } from "@/lib/db";
import { getErrorMessage } from "@/utils/validate";
import { auth } from "@clerk/nextjs";

export const getActivities = async (page = 1, queryText?: string) => {
  const { userId } = auth();

  if (!userId) {
    return {
      data: null,
      error: "Unauthorized",
      debugMessage: "No user id found",
    };
  }

  try {
    const skip = (page - 1) * ACTIVITY_PAGE_COUNT;
    const take = page * ACTIVITY_PAGE_COUNT;

    const userGroups = await db.group.findMany({
      where: { users: { some: { id: userId || "null" } } },
      select: { id: true },
      orderBy: [{ createdAt: "asc" }],
    });

    const where = {
      OR: [
        { groupId: { in: userGroups.map((u) => u.id) } },
        { users: { some: { id: userId || "null" } } },
      ],
    };

    const [count, activities] = await Promise.all([
      db.activity.count({ where }),
      db.activity.findMany({
        take,
        skip,
        where,
        orderBy: [{ createdAt: "desc" }],
      }),
    ]);

    return { data: { count, activities }, error: null };
  } catch (err) {
    return {
      data: null,
      error: "Failed to get activities",
      debugMessage: getErrorMessage(err).message,
    };
  }
};
