import { z } from "zod";

import { Expense } from "@prisma/client";

import { ActionState } from "@/lib/safe-actions";
import { UpdateExpense } from "./schema";

export type InputType = z.infer<typeof UpdateExpense>;
export type ReturnType = ActionState<
  InputType,
  { expense: Expense; userId: string }
>;
