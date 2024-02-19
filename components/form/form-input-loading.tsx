import { Skeleton } from "../ui/skeleton";

export const FormInputLoading = () => {
  return (
    <div className="flex flex-col gap-1">
      <Skeleton className="h-4 w-[100px]" />
      <Skeleton className="w-full h-10 rounded-md" />
    </div>
  );
};
