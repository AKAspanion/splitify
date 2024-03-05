import { FormInputLoading } from "@/components/form/form-input-loading";
import { Skeleton } from "@/components/ui/skeleton";

const ExpenseFormLoading = ({ add }: { add?: boolean }) => {
  return (
    <div className="flex flex-col gap-4 py-6 px-8">
      <div className="flex justify-between items-center gap-4 mb-3">
        <Skeleton className="w-10 h-10 rounded-md" />
      </div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormInputLoading />
        {add ? (
          <>
            <FormInputLoading />
            <FormInputLoading />
            <FormInputLoading />
          </>
        ) : null}
      </div>
      {add ? (
        <div className="flex justify-between items-center gap-4">
          <Skeleton className="w-[100px] h-10 rounded-md" />
          <Skeleton className="w-10 h-5 rounded-md" />
          <Skeleton className="w-[100px] h-10 rounded-md" />
        </div>
      ) : null}
      <div className="flex justify-end items-center gap-4">
        <Skeleton className="w-[50px] h-10 rounded-md" />
      </div>
    </div>
  );
};

export default ExpenseFormLoading;
