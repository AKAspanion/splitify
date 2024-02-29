import dynamic from "next/dynamic";
import { FormInputLoading } from "@/components/form/form-input-loading";
import { Skeleton } from "@/components/ui/skeleton";
import { UISpinner } from "@/components/ui-spinner";

const SettleExpense = dynamic(() => import("./settle-expense"), {
  loading: () => <UISpinner />,
});

const ExpenseFormPage = async ({
  params,
  searchParams,
}: ServerSideComponentProp) => {
  return <SettleExpense params={params} searchParams={searchParams} />;
};

export default ExpenseFormPage;
