import { z } from "zod";

export const CreateGroup = z.object({
  title: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Title is required"
          : "Title must be a string",
    })
    .min(3, { message: "Minimum 3 chars required" }),
  image_url: z.string(),
  type: z.string().optional(),
  description: z.string().optional(),
});
