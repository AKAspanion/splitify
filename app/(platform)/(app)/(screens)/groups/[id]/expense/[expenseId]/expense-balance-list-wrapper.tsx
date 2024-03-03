import { User } from "@prisma/client";
import { db } from "@/lib/db";
import { BalanceList } from "./expense-balance-list";

const BalanceListWrapper = async ({
  expenseId,
  users,
}: {
  users: User[];
  expenseId: string;
}) => {
  const expense = await db.expense.findUnique({
    where: { id: expenseId || "null" },
    include: {
      payments: { include: { user: true } },
      splits: { include: { user: true } },
    },
  });

  return <BalanceList expense={expense} users={users} />;
};

export default BalanceListWrapper;
