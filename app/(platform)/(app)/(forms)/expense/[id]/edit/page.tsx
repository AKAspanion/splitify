import dynamic from "next/dynamic";
import ExpenseFormLoading from "@/app/(platform)/(app)/_components/expense-form-loading";
import { resolvePageProps } from "@/utils/page";

const EditExpense = dynamic(() => import("./edit-expense"), {
  loading: () => <ExpenseFormLoading />,
});

const EditExpenseFormPage = async (pageProps: ServerSidePageProp) => {
  const props = await resolvePageProps(pageProps);
  return <EditExpense {...props} />;
};

export default EditExpenseFormPage;
