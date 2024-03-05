import { z } from "zod";

import { User } from "@prisma/client";

import { ActionState } from "@/lib/safe-actions";
import { CreateContact } from "./schema";

export type InputType = z.infer<typeof CreateContact>;
export type ReturnType = ActionState<InputType, { user: User; userId: string }>;
