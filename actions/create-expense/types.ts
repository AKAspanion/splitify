import { z } from "zod";

import { Expense, UserPayment, UserSplit } from "@prisma/client";

import { ActionState } from "@/lib/safe-actions";
import { CreateExpense } from "./schema";

export type InputType = {
  payers?: UserPayment[];
  splits?: UserSplit[];
} & z.infer<typeof CreateExpense>;
export type ReturnType = ActionState<InputType, Expense & {}>;
