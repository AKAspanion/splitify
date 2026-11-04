import { z } from "zod";

export const CreateSettlement = z
  .object({
    amount: z.number({
      error: (issue) =>
        issue.input === undefined ? "Amount is required" : undefined,
    }),
    groupId: z.string({
      error: (issue) =>
        issue.input === undefined ? "Group is required" : undefined,
    }),
    user1Id: z.string({
      error: (issue) =>
        issue.input === undefined ? "First party is required" : undefined,
    }),
    user2Id: z.string({
      error: (issue) =>
        issue.input === undefined ? "Second party is required" : undefined,
    }),
  })
  .refine((a) => !!a.amount, {
    message: "Please enter an amount",
    path: ["amount"],
  });
