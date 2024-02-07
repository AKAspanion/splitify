import { z } from "zod";

export const AddFriend = z.object({
  friendClerkId: z.string({}),
});
