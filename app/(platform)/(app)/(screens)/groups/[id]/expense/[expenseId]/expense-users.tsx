import { UserAvatars } from "@/app/(platform)/(app)/_components/user-avatars";
import { whoPaidExpense } from "@/app/(platform)/(app)/_utils/expense";
import { db } from "@/lib/db";

const ExpenseUsers = async ({
  groupId,
  expenseId,
}: {
  groupId: string;
  expenseId: string;
}) => {
  const expense = await db.expense.findUnique({
    where: { id: expenseId || "null", groupId },
    select: { amount: true, payments: { include: { user: true } } },
  });

  const users = expense?.payments?.map((p) => p.user) || [];

  return (
    <UserAvatars
      users={users}
      action={
        <div className="text-sm">
          {whoPaidExpense(expense?.amount, expense?.payments || [])}
        </div>
      }
    />
  );
};

export default ExpenseUsers;
