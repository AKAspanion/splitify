import { z } from "zod";

export const DeleteGroup = z.object({
  groupId: z.string({ required_error: "Group id is required" }),
});
