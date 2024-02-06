import { XCircleIcon } from "lucide-react";

type FormErrorsProps = { id?: string; errors?: string[] };

export const FormErrors = ({ id, errors }: FormErrorsProps) => {
  return !errors ? null : (
    <div
      id={`${id}-error`}
      aria-live="polite"
      className="text-red-400 text-sm mt-2"
    >
      {errors?.map((e) => (
        <p
          className="rounded-sm flex items-center gap-2 font-medium p-2 border border-red-400 bg-red-400/10"
          key={e}
        >
          <XCircleIcon className="h-4 w-4" />
          {e}
        </p>
      ))}
    </div>
  );
};
