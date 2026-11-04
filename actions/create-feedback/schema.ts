import { z } from "zod";

export const CreateFeedback = z.object({
  title: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Title is required"
          : "Title must be a string",
    })
    .min(3, { message: "Minimum 3 chars required" }),
  description: z.string().optional(),
});
