"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type State = {
  errors?: { title?: string[]; type?: string[] };
  message?: string | null;
};

const CreateGroup = z.object({
  title: z.string().min(3, { message: "Minimum 3 chars required" }),
  type: z.string().optional(),
});

export const createGroup = async (
  prevState: State,
  formData: FormData
): Promise<State> => {
  const validatedFields = CreateGroup.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors || {},
      message: "Missing fields",
    };
  }
  const { title, type } = validatedFields.data;
  try {
    await db.group.create({ data: { title, type } });
  } catch (error) {
    return { message: "Database error", errors: {} };
  }

  revalidatePath("/groups/add");
  revalidatePath("/groups");
  redirect("/groups");
};
