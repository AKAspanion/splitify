import { z } from "zod";

export const UpdateContact = z
  .object({
    name: z
      .string({
        required_error: "Name is required",
        invalid_type_error: "Name must be a string",
      })
      .min(3, { message: "Minimum 3 chars required" }),
    email: z.string().email({ message: "Please enter valid email" }),
    id: z.string({
      required_error: "ID is required",
    }),
  })
  .refine((a) => !!a.email, {
    message: "Please enter an email",
    path: ["email"],
  });
