import { z } from "zod";

import { ActionState } from "@/lib/safe-actions";
import { UpdateGroup } from "./schema";
import { GroupWIthUsers } from "@/types/shared";

export type InputType = z.infer<typeof UpdateGroup>;
export type ReturnType = ActionState<InputType, { group: GroupWIthUsers }>;
