import { z } from "zod";

export const SearchUser = z.object({
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Search keword is required"
          : "Title must be a string",
    })
    .email({ message: "Search keword must be an email" }),
});
