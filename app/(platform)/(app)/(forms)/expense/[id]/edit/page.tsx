import dynamic from "next/dynamic";
import { UISpinner } from "@/components/ui-spinner";

const EditExpense = dynamic(() => import("./edit-expense"), {
  loading: () => <UISpinner />,
});

const EditExpenseFormPage = async (props: ServerSideComponentProp) => {
  return <EditExpense {...props} />;
};

export default EditExpenseFormPage;
