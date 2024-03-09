import { z } from "zod";

import { ActionState } from "@/lib/safe-actions";
import { CreateFeedback } from "./schema";
import { Feedback } from "@prisma/client";

export type InputType = z.infer<typeof CreateFeedback>;
export type ReturnType = ActionState<
  InputType,
  { feedback: Feedback; userId: string }
>;
