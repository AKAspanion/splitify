import { z } from "zod";

export const CreateSettlement = z
  .object({
    amount: z.number({ required_error: "Amount is required" }),
    currency: z.string({ required_error: "Currency is required" }),
    groupId: z.string({ required_error: "Group is required" }),
    user1Id: z.string({ required_error: "First party is required" }),
    user2Id: z.string({ required_error: "Second party is required" }),
  })
  .refine((a) => !!a.amount, {
    message: "Please enter an amount",
    path: ["amount"],
  });
