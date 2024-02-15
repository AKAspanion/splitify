import { z } from "zod";

export const AddFriend = z.object({
  friendId: z.string({ required_error: "Friend id is required" }),
  groupId: z.string().optional(),
});
