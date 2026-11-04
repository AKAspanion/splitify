import { z } from "zod";

import { ActionState } from "@/lib/safe-actions";
import { DeleteAccount } from "./schema";

export type InputType = z.infer<typeof DeleteAccount>;
export type ReturnType = ActionState<InputType, { deleted: true }>;
