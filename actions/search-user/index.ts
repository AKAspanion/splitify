"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { SearchUser } from "./schema";
import { getErrorMessage } from "@/utils/validate";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { email } = data;

  let user;
  try {
    user = await db.user.findMany({
      where: { email: { equals: email }, id: { not: userId } },
      include: { friends: true },
    });
  } catch (error) {
    return {
      error: "Failed to find user",
      debugMessage: getErrorMessage(error).message,
    };
  }

  revalidatePath(`/friends/add`);
  return { data: user };
};

export const searchUser = createSafeAction(SearchUser, handler);
