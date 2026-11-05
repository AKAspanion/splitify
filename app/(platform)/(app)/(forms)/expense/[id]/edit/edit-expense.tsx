"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { useSearchParams } from "next/navigation";
import { useRouteIds } from "@/hooks/use-route-ids";
import { useExpense } from "@/lib/data/expenses";
import ExpenseFormLoading, {
  ExpenseLoadError,
  ExpenseNotFound,
} from "@/app/(platform)/(app)/_components/expense-form-loading";
import Form from "./form";

const EditExpense = () => {
  const { expenseId } = useRouteIds();
  const searchParams = useSearchParams();
  const { data: expense, error, isPending, refetch } = useExpense(expenseId);

  const groupId = searchParams.get("groupId") || expense?.groupId || "";
  const backTo = groupId
    ? `/groups/${groupId}/expense/${expenseId || ""}`
    : `/groups`;

  // An id that is not a real expense id never leaves the browser: it is the not-found screen at once.
  const body = !expenseId ? (
    <ExpenseNotFound />
  ) : error ? (
    <ExpenseLoadError error={error} onRetry={() => refetch()} />
  ) : isPending ? (
    <ExpenseFormLoading />
  ) : expense ? (
    <Form
      id={expense.id}
      description={expense.description}
      groupId={expense.groupId}
    />
  ) : (
    <ExpenseNotFound />
  );

  return (
    <AutoContainer header={<Header backTo={backTo} title="Update expense" />}>
      {body}
    </AutoContainer>
  );
};

export default EditExpense;
