import { z } from "zod";

import { Group } from "@/generated/prisma/browser";

import { ActionState } from "@/lib/safe-actions";
import { UpdateGroup } from "./schema";

export type InputType = z.infer<typeof UpdateGroup>;
export type ReturnType = ActionState<
  InputType,
  { group: Group; userId: string }
>;
