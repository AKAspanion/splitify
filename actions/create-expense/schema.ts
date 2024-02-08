import { z } from "zod";

export const CreateExpense = z.object({
  description: z
    .string({
      required_error: "Description is required",
      invalid_type_error: "Description must be a string",
    })
    .min(3, { message: "Minimum 3 chars required" }),
  amount: z.number({ required_error: "Amount is required" }),
});
