import { z } from "zod";

import { Expense } from "@prisma/client";

import { ActionState } from "@/lib/safe-actions";
import { CreateExpense } from "./schema";

export type InputType = z.infer<typeof CreateExpense>;
export type ReturnType = ActionState<InputType, Expense & {}>;
