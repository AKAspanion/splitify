"use client";
import {
  UserAvatars,
  UserAvatarsLoading,
} from "@/app/(platform)/(app)/_components/user-avatars";
import { whoPaidExpense } from "@/app/(platform)/(app)/_utils/expense";
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

  return isSettlement ? null : expense ? (
    <>
      <UserAvatars
        users={users}
        action={
          expense?.amount ? (
            <div className="text-sm">
              {whoPaidExpense(expense?.amount, payments || [], user?.id || "")}
            </div>
          ) : (
            ""
          )
        }
      />
      {balance}
    </>
  ) : (
    <UserAvatarsLoading lg />
  );
};

export default ExpenseUsersClient;
