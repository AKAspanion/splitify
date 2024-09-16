"use client";
import {
  UserAvatars,
  UserAvatarsLoading,
} from "@/app/(platform)/(app)/_components/user-avatars";
import { whoPaidExpense } from "@/app/(platform)/(app)/_utils/expense";
import { RUPEE_SYMBOL } from "@/constants/ui";
import useExpense from "@/hooks/use-expense";
import { UserPaymentWithUser } from "@/types/shared";
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

  if (expense?.amount) {
    whoPaidValue = whoPaidValue + ` ${RUPEE_SYMBOL}${expense?.amount}`;
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
