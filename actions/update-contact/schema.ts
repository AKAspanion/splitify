import { z } from "zod";

export const UpdateContact = z
  .object({
    name: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "Name is required"
            : "Name must be a string",
      })
      .min(3, { message: "Minimum 3 chars required" }),
    email: z.string().email({ message: "Please enter valid email" }),
    id: z.string({
      error: (issue) =>
        issue.input === undefined ? "ID is required" : undefined,
    }),
  })
  .refine((a) => !!a.email, {
    message: "Please enter an email",
    path: ["email"],
  });
