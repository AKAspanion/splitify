import { z } from "zod";

export const AddFriend = z.object({
  friendId: z.string({
    error: (issue) =>
      issue.input === undefined ? "Friend id is required" : undefined,
  }),
  groupId: z.string().optional(),
});
