import { fixedNum } from "@/utils/validate";
import { ExpenseType } from "@/generated/prisma/browser";
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
        error: (issue) =>
          issue.input === undefined
            ? "Description is required"
            : "Description must be a string",
      })
      .min(3, { message: "Minimum 3 chars required" }),
    amount: z.number({
      error: (issue) =>
        issue.input === undefined ? "Amount is required" : undefined,
    }),
    groupId: z.string({
      error: (issue) =>
        issue.input === undefined ? "Group is required" : undefined,
    }),
    createrId: z.string({
      error: (issue) =>
        issue.input === undefined ? "Creator id is required" : undefined,
    }),
    category: z.string().optional(),
    type: expenseType,
  })
  .refine(
    (a) => {
      const total = a.payments.reduce(
        (sum, a) => sum + (isNaN(a.amount) ? 0 : a.amount),
        0,
      );
      return fixedNum(total, 0) === fixedNum(a.amount, 0);
    },
    {
      message: "All paid amount don't add up to total amount",
      path: ["payments"],
    },
  )
  .refine(
    (a) => {
      const total = a.splits.reduce(
        (sum, a) => sum + (isNaN(a.amount) ? 0 : a.amount),
        0,
      );
      return fixedNum(total, 0) === fixedNum(a.amount, 0);
    },
    {
      message: "All split amount don't add up to total amount",
      path: ["splits"],
    },
  )
  .refine((a) => !!a.amount, {
    message: "Please enter an amount",
    path: ["amount"],
  })
  .refine((a) => !!a.groupId, {
    message: "Please select a group",
    path: ["groupId"],
  });
