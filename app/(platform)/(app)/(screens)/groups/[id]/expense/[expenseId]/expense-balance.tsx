"use client";

import BalanceSummaryList from "./expense-balance-summary-list";
import BalanceList from "./expense-balance-list-wrapper";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { User } from "@/generated/prisma/browser";
import type { ExpenseWithPaymentWithSplit } from "@/types/shared";

const Balance = ({
  expense,
  users,
  userId,
  groupId,
  expenseId,
  balance,
}: {
  expense: ExpenseWithPaymentWithSplit;
  users: User[];
  userId: string | null;
  groupId: string;
  expenseId: string;
  balance: boolean;
}) => {
  return (
    <>
      <BalanceSummaryList
        userId={userId}
        payments={expense.payments}
        splits={expense.splits}
        users={users}
      />
      {balance ? (
        <>
          <hr />
          <BalanceList expense={expense} users={users} />
          <Link href={`/groups/${groupId}/expense/${expenseId}?balance=`}>
            <Button variant={"secondary"}>Hide balance</Button>
          </Link>
        </>
      ) : (
        <Link href={`/groups/${groupId}/expense/${expenseId}?balance=yes`}>
          <Button variant={"secondary"}>Show balance</Button>
        </Link>
      )}
    </>
  );
};

export default Balance;
