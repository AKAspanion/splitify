import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { upsertMyFeedback } from "@dataconnect/app";
import { dc } from "./client";

export const FEEDBACK_TITLE_MAX = 100;
export const FEEDBACK_DESCRIPTION_MAX = 500;

/** Sends the person's one feedback row; sending again replaces it. */
export function useSendFeedback(): UseMutationResult<
  void,
  Error,
  { title: string; description?: string }
> {
  return useMutation({
    mutationFn: async ({ title, description }) => {
      await upsertMyFeedback(dc(), {
        title,
        description: description || null,
      });
    },
  });
}
