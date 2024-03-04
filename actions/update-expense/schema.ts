import { fixedNum } from "@/utils/validate";
import { ExpenseType } from "@prisma/client";
import { z } from "zod";

export const UpdateExpense = z.object({
  description: z
    .string({
      required_error: "Description is required",
      invalid_type_error: "Description must be a string",
    })
    .min(3, { message: "Minimum 3 chars required" }),
  id: z.string({ required_error: "Expense id is required" }),
});
