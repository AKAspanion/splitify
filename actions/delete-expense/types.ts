import { z } from "zod";

import { Expense } from "@prisma/client";

import { ActionState } from "@/lib/safe-actions";
import { DeleteExpense } from "./schema";

export type InputType = z.infer<typeof DeleteExpense>;
export type ReturnType = ActionState<
  InputType,
  { message: string; userId: string; groupId?: string; expenseDesc: string }
>;
