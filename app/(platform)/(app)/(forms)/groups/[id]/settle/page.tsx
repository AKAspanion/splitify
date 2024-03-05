import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { FormInputLoading } from "@/components/form/form-input-loading";

const SettleExpense = dynamic(() => import("./settle-expense"), {
  loading: () => (
    <div className="flex flex-col gap-4 px-8 py-6">
      <div className="flex justify-between items-center gap-4 mb-3">
        <Skeleton className="w-[120px] h-10 rounded-md" />
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center gap-4">
          <Skeleton className="w-[56px] h-[56px] rounded-full" />
          <Skeleton className="w-10 h-10 rounded-md" />
          <Skeleton className="w-[56px] h-[56px] rounded-full" />
        </div>
        <div className="flex justify-between items-center gap-4">
          <Skeleton className="w-[56px] h-6 rounded-md" />
          <Skeleton className="w-10 h-5 rounded-md" />
          <Skeleton className="w-[56px] h-6 rounded-md" />
        </div>
      </div>
      <div>
        <FormInputLoading />
      </div>
      <div className="flex justify-end items-center gap-4">
        <Skeleton className="w-[72px] h-10 rounded-md" />
      </div>
    </div>
  ),
});

const ExpenseFormPage = async (props: ServerSideComponentProp) => {
  return <SettleExpense {...props} />;
};

export default ExpenseFormPage;
