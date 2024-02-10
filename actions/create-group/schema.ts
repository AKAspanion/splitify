import { z } from "zod";

export const CreateGroup = z.object({
  title: z
    .string({
      required_error: "Title is required",
      invalid_type_error: "Title must be a string",
    })
    .min(3, { message: "Minimum 3 chars required" }),
  image_url: z.string(),
  type: z.string().optional(),
});
