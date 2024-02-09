import { z } from "zod";

export const SearchUser = z.object({
  email: z
    .string({
      required_error: "Search keword is required",
      invalid_type_error: "Title must be a string",
    })
    .email({ message: "Search keword must be an email" }),
});
