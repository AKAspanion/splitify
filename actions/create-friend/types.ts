import { z } from "zod";

import { ActionState } from "@/lib/safe-actions";
import { AddFriend } from "./schema";

export type InputType = z.infer<typeof AddFriend>;
export type ReturnType = ActionState<InputType, { message: string }>;
