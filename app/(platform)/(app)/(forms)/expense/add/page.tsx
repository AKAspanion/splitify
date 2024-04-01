import dynamic from "next/dynamic";
import ExpenseFormLoading from "@/app/(platform)/(app)/_components/expense-form-loading";

const AddExpense = dynamic(() => import("./add-expense"), {
  loading: () => <ExpenseFormLoading add />,
});

const ExpenseFormPage = async ({
  params,
  searchParams,
}: ServerSideComponentProp) => {
  return <AddExpense params={params} searchParams={searchParams} />;
};

export default ExpenseFormPage;
