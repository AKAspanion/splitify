import { z } from "zod";

export const UpdateGroup = z
  .object({
    title: z
      .string({
        required_error: "Title is required",
        invalid_type_error: "Title must be a string",
      })
      .min(3, { message: "Minimum 3 chars required" }),
    description: z.string().optional(),
    type: z.string().optional(),
    groupId: z.string(),
  })
  .refine((a) => !!a.groupId, {
    message: "Please select a group",
    path: ["groupId"],
  });
