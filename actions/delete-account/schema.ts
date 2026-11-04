import { z } from "zod";

// No input: a person can only delete their own account, taken from the session.
export const DeleteAccount = z.object({});
