import { Input, InputProps } from "@/components/ui/input";
import { useFormStatus } from "react-dom";

type FormInputProps = { errors?: string[] } & InputProps;

export const FormInput = (props: FormInputProps) => {
  const { errors, ...rest } = props;
  const { pending } = useFormStatus();
  return (
    <div>
      <Input {...rest} disabled={pending} />
      {errors ? (
        <div>
          {errors?.map((e) => (
            <p className="text-red-500 text-sm py-2" key={e}>
              {e}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
};
