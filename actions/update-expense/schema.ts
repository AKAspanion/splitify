import { fixedNum } from "@/utils/validate";
import { ExpenseType } from "@/generated/prisma/browser";
import { z } from "zod";

export const UpdateExpense = z.object({
  description: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Description is required"
          : "Description must be a string",
    })
    .min(3, { message: "Minimum 3 chars required" }),
  id: z.string({
    error: (issue) =>
      issue.input === undefined ? "Expense id is required" : undefined,
  }),
});
