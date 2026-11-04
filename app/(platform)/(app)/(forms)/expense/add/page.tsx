import dynamic from "next/dynamic";
import ExpenseFormLoading from "@/app/(platform)/(app)/_components/expense-form-loading";
import { resolvePageProps } from "@/utils/page";

const AddExpense = dynamic(() => import("./add-expense"), {
  loading: () => <ExpenseFormLoading add />,
});

const ExpenseFormPage = async (pageProps: ServerSidePageProp) => {
  const { params, searchParams } = await resolvePageProps(pageProps);
  return <AddExpense params={params} searchParams={searchParams} />;
};

export default ExpenseFormPage;
