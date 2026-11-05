"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { useSearchParams } from "next/navigation";
import { useExpenseGroups } from "@/lib/data/expenses";
import ExpenseFormLoading, {
  ExpenseLoadError,
} from "@/app/(platform)/(app)/_components/expense-form-loading";
import Form from "./(form)/form";

const AddExpense = () => {
  const searchParams = useSearchParams();
  const { data: groups, error, isPending, refetch } = useExpenseGroups();

  const groupdId = searchParams.get("groupId") || "";
  const backTo = groupdId ? `/groups/${groupdId}` : `/groups`;

  return (
    <AutoContainer header={<Header backTo={backTo} title="Add an expense" />}>
      {error ? (
        <ExpenseLoadError error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <ExpenseFormLoading add />
      ) : (
        <Form groups={groups} />
      )}
    </AutoContainer>
  );
};

export default AddExpense;
