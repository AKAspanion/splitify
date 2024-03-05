import { FormInputLoading } from "@/components/form/form-input-loading";
import { Skeleton } from "@/components/ui/skeleton";

const GroupFormLoading = () => {
  return (
    <div className="flex flex-col gap-6 px-8 py-6">
      <div className="flex justify-between items-center gap-4 mb-3">
        <Skeleton className="w-[120px] h-10 rounded-md" />
      </div>
      <div className="flex flex-col gap-4">
        <FormInputLoading />
        <FormInputLoading />
      </div>
      <div>
        <Skeleton className="w-[100px] h-4" />
        <div className="w-full flex flex-wrap gap-3 items-center pt-3">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <Skeleton key={id} className="rounded-2xl w-[90px] h-[30px]" />
          ))}
        </div>
      </div>
      <div className="flex justify-end items-center gap-4">
        <Skeleton className="w-[82px] h-10 rounded-md" />
      </div>
    </div>
  );
};

export default GroupFormLoading;
