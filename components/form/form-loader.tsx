import { useFormStatus } from "react-dom";
import { Progress } from "../ui/progress";
import Spinner from "../ui/spinner";

type FormLoaderProps = { kind: "spinner" | "progress" };

export const FormLoader = ({ kind }: FormLoaderProps) => {
  const { pending } = useFormStatus();

  return pending ? (
    <div>{kind === "progress" ? <Progress /> : <Spinner />} </div>
  ) : null;
};
