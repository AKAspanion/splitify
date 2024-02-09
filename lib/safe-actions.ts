import { z } from "zod";

export type FieldErrors<T> = {
  [K in keyof T]?: string[];
};

export type ActionState<TInput, TOutput> = {
  fieldErrors?: FieldErrors<TInput>;
  error?: string | null;
  debugMessage?: string | null;
  data?: TOutput;
};

export const createSafeAction =
  <TI, TO>(
    schema: z.Schema<TI>,
    handler: (validatedData: TI) => Promise<ActionState<TI, TO>>,
  ) =>
  async (data: TI): Promise<ActionState<TI, TO>> => {
    const validationResult = schema.safeParse(data);

    if (!validationResult.success) {
      return {
        fieldErrors: <FieldErrors<TI>>(
          validationResult.error.flatten().fieldErrors
        ),
      };
    }

    return handler(validationResult.data);
  };
