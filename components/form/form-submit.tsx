"use client";
import { Button, ButtonProps } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

type FormSubmitProps = { children?: React.ReactNode } & ButtonProps;

export const FormSubmit = ({
  children,
  disabled,
  ...rest
}: FormSubmitProps) => {
  const { pending } = useFormStatus();
  return (
    <div className="flex justify-end items-center">
      <Button
        {...rest}
        loading={pending}
        disabled={pending || disabled}
        type="submit"
      >
        {children}
      </Button>
    </div>
  );
};
