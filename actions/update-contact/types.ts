import { z } from "zod";

import { User } from "@/generated/prisma/browser";

import { ActionState } from "@/lib/safe-actions";
import { UpdateContact } from "./schema";

export type InputType = z.infer<typeof UpdateContact>;
export type ReturnType = ActionState<InputType, { user: User; userId: string }>;
