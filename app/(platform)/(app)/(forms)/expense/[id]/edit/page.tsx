import dynamic from "next/dynamic";
import ExpenseFormLoading from "@/app/(platform)/(app)/_components/expense-form-loading";

const EditExpense = dynamic(() => import("./edit-expense"), {
  loading: () => <ExpenseFormLoading />,
});

const EditExpenseFormPage = async (props: ServerSideComponentProp) => {
  return <EditExpense {...props} />;
};

export default EditExpenseFormPage;
