import { z } from "zod";

export const DeleteGroup = z.object({
  groupId: z.string({
    error: (issue) =>
      issue.input === undefined ? "Group id is required" : undefined,
  }),
});
