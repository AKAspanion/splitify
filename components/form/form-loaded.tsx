import { useFormStatus } from "react-dom";

type FormLoadedProps = { children?: React.ReactNode };

export const FormLoaded = ({ children }: FormLoadedProps) => {
  const { pending } = useFormStatus();

  return !pending ? <>{children}</> : null;
};
