import { z } from "zod";

export const DeleteExpense = z.object({
  groupId: z.string().optional(),
  expenseId: z.string({ required_error: "Expense id is required" }),
});
