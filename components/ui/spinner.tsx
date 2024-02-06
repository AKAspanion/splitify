import { Loader2 } from "lucide-react";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

const Spinner = ({ size = "md" }: SpinnerProps) => {
  const sizeClass =
    size === "md" ? "h-8 w-8" : size === "sm" ? "h-4 w-4" : "h-12 w-12";
  return <Loader2 className={`${sizeClass} animate-spin`} />;
};

export default Spinner;
