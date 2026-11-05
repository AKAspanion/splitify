"use client";
import { UserAvatars } from "@/app/(platform)/(app)/_components/user-avatars";
import { whoPaidExpense } from "@/app/(platform)/(app)/_utils/expense";
import { RUPEE_SYMBOL } from "@/constants/ui";
import { UserPaymentWithUser } from "@/types/shared";

const ExpenseUsersClient = ({
  payments,
  amount,
  isSettlement,
  userId,
  balance,
}: {
  payments: UserPaymentWithUser[];
  amount: number;
  isSettlement: boolean;
  userId: string | null;
  balance: React.ReactNode;
}) => {
  const users = payments?.map((p) => p.user) || [];

  let whoPaidValue = whoPaidExpense(payments || [], userId || "");
  if (amount) {
    whoPaidValue = whoPaidValue + ` ${RUPEE_SYMBOL}${amount}`;
  }

  return isSettlement ? null : (
    <>
      <UserAvatars users={users} action={<>{whoPaidValue}</>} />
      {balance}
    </>
  );
};

export default ExpenseUsersClient;
