"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useRouteIds } from "@/hooks/use-route-ids";
import {
  toExpenseView,
  useExpense,
  useExpenseGroupMembers,
} from "@/lib/data/expenses";
import {
  ExpenseLoadError,
  ExpenseNotFound,
} from "@/app/(platform)/(app)/_components/expense-form-loading";
import ExpenseHeader from "./expense-header";
import ExpenseClient from "./expense-client";
import ExpenseAddedBy from "./expense-added-by";
import ExpenseUsers from "./expense-users";
import Balance from "./expense-balance";

const ExpenseSkeleton = () => (
  <div className="flex flex-col gap-6">
    <Skeleton className="h-7 w-[80px]" />
    <Skeleton className="h-5 w-[120px]" />
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-[120px]" />
      <Skeleton className="h-4 w-[160px]" />
      <Skeleton className="h-4 w-[60px]" />
    </div>
  </div>
);

const ExpenseDetails = () => {
  const { user } = useAuth();
  const { groupId, expenseId } = useRouteIds();
  const searchParams = useSearchParams();
  const showBalance = searchParams.get("balance") === "yes";

  const expenseQuery = useExpense(expenseId);
  const membersQuery = useExpenseGroupMembers(groupId);
  const expense = expenseQuery.data;
  const members = membersQuery.data;

  const view = useMemo(
    () => (expense && members ? toExpenseView(expense, members) : null),
    [expense, members],
  );

  const backTo = `/groups/${groupId || ""}`;
  const error = expenseQuery.error || membersQuery.error;

  let body: React.ReactNode;
  if (!groupId || !expenseId) {
    body = <ExpenseNotFound />;
  } else if (error) {
    body = (
      <ExpenseLoadError
        error={error}
        onRetry={() => {
          expenseQuery.refetch();
          membersQuery.refetch();
        }}
      />
    );
  } else if (expenseQuery.isPending || membersQuery.isPending) {
    body = <ExpenseSkeleton />;
  } else if (!expense || !view) {
    body = <ExpenseNotFound />;
  } else {
    body = (
      <div className="flex flex-col gap-6">
        <ExpenseClient expense={expense} />
        <ExpenseAddedBy
          expense={expense}
          addedById={expense.creator.id}
          addedByName={expense.creator.name}
          userId={user?.uid}
        />
        <ExpenseUsers
          expense={view.expense}
          userId={user?.uid ?? null}
          balance={
            <Balance
              expense={view.expense}
              users={view.users}
              userId={user?.uid ?? null}
              groupId={groupId}
              expenseId={expenseId}
              balance={showBalance}
            />
          }
        />
      </div>
    );
  }

  return (
    <AutoContainer
      header={
        expense ? (
          <ExpenseHeader groupId={groupId || ""} expense={expense} />
        ) : (
          <Header backTo={backTo} title="Expense details" />
        )
      }
    >
      {body}
    </AutoContainer>
  );
};

export default ExpenseDetails;
