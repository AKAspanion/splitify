import { z } from "zod";

export const AddFriend = z.object({
  friendId: z.string({}),
});
