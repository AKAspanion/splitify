import { z } from "zod";

export const DeleteExpense = z.object({
  groupId: z.string().optional(),
  expenseId: z.string({
    error: (issue) =>
      issue.input === undefined ? "Expense id is required" : undefined,
  }),
});
