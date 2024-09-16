"use client";
import {
  UserAvatars,
  UserAvatarsLoading,
} from "@/app/(platform)/(app)/_components/user-avatars";
import { whoPaidExpense } from "@/app/(platform)/(app)/_utils/expense";
import useExpense from "@/hooks/use-expense";
import { UserPaymentWithUser } from "@/types/shared";
import { getCurrencySymbol } from "@/utils/currency";
import { useUser } from "@clerk/nextjs";

const ExpenseUsersClient = ({
  groupId,
  expenseId,
  payments,
  balance,
}: {
  expenseId: string;
  groupId: string;
  payments: UserPaymentWithUser[];
  balance: React.ReactNode;
}) => {
  const { user } = useUser();
  const { expense } = useExpense(expenseId, groupId);
  const users = payments?.map((p) => p.user) || [];

  const isSettlement = expense?.tag === "SETTLEMENT";

  const whoPaid = whoPaidExpense(payments || [], user?.id || "");

  let whoPaidValue = whoPaid;
  const symbol = getCurrencySymbol(expense?.currency || "");

  if (expense?.amount) {
    whoPaidValue = whoPaidValue + ` ${symbol}${expense?.amount}`;
  }

  return isSettlement ? null : expense ? (
    <>
      <UserAvatars users={users} action={<>{whoPaidValue}</>} />
      {balance}
    </>
  ) : (
    <UserAvatarsLoading lg />
  );
};

export default ExpenseUsersClient;
