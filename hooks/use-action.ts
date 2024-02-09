import { useState, useCallback } from "react";

import { ActionState, FieldErrors } from "@/lib/safe-actions";

type Action<TI, TO> = (data: TI) => Promise<ActionState<TI, TO>>;

interface UseActionOptions<TO> {
  onSuccess?: (data: TO) => void;
  onError?: (error: string, debugMessage?: string) => void;
  onComplete?: () => void;
}

export const useAction = <TInput, TOutput>(
  action: Action<TInput, TOutput>,
  options?: UseActionOptions<TOutput>,
) => {
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<TInput> | undefined
  >(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [data, setData] = useState<TOutput | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  const execute = useCallback(
    async (input: TInput) => {
      try {
        setLoading(true);
        const results = await action(input);

        if (!results) {
          return;
        }

        setFieldErrors(results?.fieldErrors);

        if (results?.error) {
          setError(results?.error);
          options?.onError?.(results.error, results.debugMessage || "");
        }

        if (results?.data) {
          setData(results?.data);
          options?.onSuccess?.(results.data);
        }
      } catch (error) {
        setLoading(false);
      } finally {
        setLoading(false);
        options?.onComplete?.();
      }
    },
    [action, options],
  );

  return {
    execute,
    fieldErrors,
    error,
    loading,
    data,
  };
};
