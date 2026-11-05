"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { useSearchParams } from "next/navigation";
import { useRouteIds } from "@/hooks/use-route-ids";
import { useExpenseGroupMembers } from "@/lib/data/expenses";
import {
  ExpenseLoadError,
  ExpenseNotFound,
} from "@/app/(platform)/(app)/_components/expense-form-loading";
import { UISpinner } from "@/components/ui-spinner";
import SettleUsers from "./settle-users";
import Form from "./(form)/form";

const SettleExpense = () => {
  const { groupId } = useRouteIds();
  const searchParams = useSearchParams();
  const {
    data: members,
    error,
    isPending,
    refetch,
  } = useExpenseGroupMembers(groupId);

  const backTo = groupId
    ? `/groups/${groupId}?tab=Balances`
    : `/groups?tab=Balances`;

  const user1Id = searchParams.get("user1Id") || "";
  const user2Id = searchParams.get("user2Id") || "";

  const owes = searchParams.get("owes") || "";
  const amount = isNaN(Number(owes)) ? 0 : parseFloat(owes) || 0;

  const isMember = (id: string) => !!members?.some((m) => m.id === id);

  const body = !groupId ? (
    <ExpenseNotFound />
  ) : error ? (
    <ExpenseLoadError error={error} onRetry={() => refetch()} />
  ) : isPending ? (
    <UISpinner />
  ) : !members.length || !isMember(user1Id) || !isMember(user2Id) ? (
    <ExpenseNotFound />
  ) : (
    <div className="flex flex-col gap-4 sm:gap-6">
      <SettleUsers user1Id={user1Id} user2Id={user2Id} members={members} />
      <Form
        groupId={groupId}
        amount={amount}
        user1Id={user1Id}
        user2Id={user2Id}
      />
    </div>
  );

  return (
    <AutoContainer header={<Header backTo={backTo} title="Settlement" />}>
      {body}
    </AutoContainer>
  );
};

export default SettleExpense;
