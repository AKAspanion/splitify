import dynamic from "next/dynamic";
import { FormInputLoading } from "@/components/form/form-input-loading";
import { Skeleton } from "@/components/ui/skeleton";

const AddExpense = dynamic(() => import("./add-expense"), {
  loading: () => (
    <div className="flex flex-col gap-4 py-6 px-8">
      <div className="flex justify-between items-center gap-4 mb-3">
        <Skeleton className="w-10 h-10 rounded-md" />
      </div>
      <FormInputLoading />
      <FormInputLoading />
      <FormInputLoading />
      <FormInputLoading />
      <div className="flex justify-between items-center gap-4">
        <Skeleton className="w-[100px] h-10 rounded-md" />
        <Skeleton className="w-10 h-5 rounded-md" />
        <Skeleton className="w-[100px] h-10 rounded-md" />
      </div>
      <div className="flex justify-end items-center gap-4">
        <Skeleton className="w-[50px] h-10 rounded-md" />
      </div>
    </div>
  ),
});

const ExpenseFormPage = async ({
  params,
  searchParams,
}: ServerSideComponentProp) => {
  return <AddExpense params={params} searchParams={searchParams} />;
};

export default ExpenseFormPage;
