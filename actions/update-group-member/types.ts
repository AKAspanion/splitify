import { z } from "zod";

import { ActionState } from "@/lib/safe-actions";
import { UpdateGroup } from "./schema";
import { Group } from "@prisma/client";

export type InputType = z.infer<typeof UpdateGroup>;
export type ReturnType = ActionState<
  InputType,
  { userId: string; groupId: string; friendId: string }
>;
