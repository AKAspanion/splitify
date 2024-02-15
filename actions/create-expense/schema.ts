import { ExpenseType } from "@prisma/client";
import { z } from "zod";

const expenseType = z.enum([
  ExpenseType.EQUAL,
  ExpenseType.EXACT,
  ExpenseType.PERCENT,
]);

export const CreateExpense = z
  .object({
    payments: z.array(z.object({ amount: z.number(), userId: z.string() })),
    splits: z.array(
      z.object({
        percent: z.number().optional(),
        type: expenseType,
        amount: z.number(),
        userId: z.string(),
      }),
    ),
    description: z
      .string({
        required_error: "Description is required",
        invalid_type_error: "Description must be a string",
      })
      .min(3, { message: "Minimum 3 chars required" }),
    amount: z.number({ required_error: "Amount is required" }),
    groupId: z.string({ required_error: "Group is required" }),
    createrId: z.string({ required_error: "Creator id is required" }),
    type: expenseType,
  })
  .refine(
    (a) => {
      const total = a.payments.reduce((sum, a) => sum + a.amount || 0, 0);
      return total === a.amount;
    },
    { message: "All paid amount don't add up to total", path: ["payments"] },
  )
  .refine((a) => !!a.amount, {
    message: "Please enter an amount",
    path: ["amount"],
  })
  .refine((a) => !!a.groupId, {
    message: "Please select a group",
    path: ["groupId"],
  });
