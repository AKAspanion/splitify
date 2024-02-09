import { Input, InputProps } from "@/components/ui/input";
import { useFormStatus } from "react-dom";
import { Label } from "../ui/label";
import { FormErrors } from "./form-errors";

type FormInputProps = { label?: string; errors?: string[] } & InputProps;

export const FormInput = (props: FormInputProps) => {
  const { id, label, disabled, errors, ...rest } = props;
  const { pending } = useFormStatus();
  return (
    <div className="w-full">
      {label ? (
        <Label
          htmlFor={id}
          className="text-sm font-semi-bold text-neutral-700 dark:text-neutral-50"
        >
          {label}
        </Label>
      ) : null}
      <div className={label ? "mt-1 w-full" : "w-full"}>
        <Input
          id={id}
          {...rest}
          disabled={pending || disabled}
          aria-describedby={`${id}-error`}
        />
        <FormErrors id={id} errors={errors} />
      </div>
    </div>
  );
};
