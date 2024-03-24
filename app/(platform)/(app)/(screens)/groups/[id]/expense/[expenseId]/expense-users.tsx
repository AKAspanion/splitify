import { UserAvatars } from "@/app/(platform)/(app)/_components/user-avatars";
import { whoPaidExpense } from "@/app/(platform)/(app)/_utils/expense";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import ExpenseUsersClient from "./expense-users-client";

const ExpenseUsers = async ({
  expenseId,
  groupId,
  balance,
}: {
  expenseId: string;
  groupId: string;
  balance: React.ReactNode;
}) => {
  const payments = await db.userPayment.findMany({
    where: { expenseId },
    include: { user: true },
  });

  return (
    <ExpenseUsersClient
      payments={payments}
      expenseId={expenseId}
      groupId={groupId}
      balance={balance}
    />
  );
};

export default ExpenseUsers;
