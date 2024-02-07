import { useFormStatus } from "react-dom";

type FormLoadingProps = { children?: React.ReactNode };

export const FormLoading = ({ children }: FormLoadingProps) => {
  const { pending } = useFormStatus();

  return pending ? <>{children}</> : null;
};
