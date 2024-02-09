import { z } from "zod";

import { Group } from "@prisma/client";

import { ActionState } from "@/lib/safe-actions";
import { UpdateGroup } from "./schema";

export type InputType = z.infer<typeof UpdateGroup>;
export type ReturnType = ActionState<InputType, Group>;
