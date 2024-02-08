import { ExpenseType } from "@prisma/client";
import { z } from "zod";

export const CreateExpense = z
  .object({
    payers: z.array(z.object({ amount: z.number(), userId: z.string() })),
    splits: z.array(
      z.object({
        percent: z.number().optional(),
        type: z.enum([
          ExpenseType.EQUAL,
          ExpenseType.EXACT,
          ExpenseType.PERCENT,
        ]),
        amount: z.number(),
        userId: z.string(),
      })
    ),
    description: z
      .string({
        required_error: "Description is required",
        invalid_type_error: "Description must be a string",
      })
      .min(3, { message: "Minimum 3 chars required" }),
    amount: z.number({ required_error: "Amount is required" }),
  })
  .refine(
    (a) => {
      const total = a.payers.reduce((sum, a) => sum + a.amount || 0, 0);
      return total === a.amount;
    },
    { message: "All paid amount don't add up to total", path: ["payers"] }
  )
  .refine(
    (a) => {
      return !!a.amount;
    },
    { message: "Please enter an amount", path: ["amount"] }
  );
