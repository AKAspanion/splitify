import { z } from "zod";

import { User } from "@prisma/client";

import { ActionState } from "@/lib/safe-actions";
import { AddFriend } from "./schema";

export type InputType = z.infer<typeof AddFriend>;
export type ReturnType = ActionState<InputType, User>;
