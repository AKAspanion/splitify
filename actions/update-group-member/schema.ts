import { z } from "zod";

export const UpdateGroup = z.object({
  groupId: z.string(),
  memberClerkId: z.string(),
});
