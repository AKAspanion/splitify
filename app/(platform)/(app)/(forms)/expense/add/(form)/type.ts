import { Group, User } from "@prisma/client";

export type GroupWIthUsers = { users: User[] } & Group;
