"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/safe-actions";
import { SearchUser } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId } = auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { email } = data;

  let user;
  try {
    user = await db.user.findMany({ where: { email: { equals: email } } });
  } catch (error) {
    return { error: "Failed to search user" };
  }

  revalidatePath(`/friends/add`);
  return { data: user };
};

export const searchUser = createSafeAction(SearchUser, handler);
