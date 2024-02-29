import { z } from "zod";

import { Expense } from "@prisma/client";

import { ActionState } from "@/lib/safe-actions";
import { CreateSettlement } from "./schema";

export type InputType = z.infer<typeof CreateSettlement>;
export type ReturnType = ActionState<
  InputType,
  { expense?: Expense; userId: string }
>;
