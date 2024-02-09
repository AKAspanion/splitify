import { z } from "zod";

import { User } from "@prisma/client";

import { ActionState } from "@/lib/safe-actions";
import { SearchUser } from "./schema";

type UserWithFriends = User & {
  friends: User[];
};

export type InputType = z.infer<typeof SearchUser>;
export type ReturnType = ActionState<InputType, UserWithFriends[]>;
