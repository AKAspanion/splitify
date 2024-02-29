import { db } from "@/lib/db";
import { BalanceList } from "./expense-balance-list";
import BalanceSummaryList from "./expense-balance-summary-list";

const Balance = async ({
  userId,
  groupId,
  expenseId,
}: {
  userId: string | null;
  groupId: string;
  expenseId: string;
}) => {
  const [group, expense] = await db.$transaction([
    db.group.findUnique({
      where: { id: groupId, users: { some: { id: userId || "null" } } },
      select: { users: true },
    }),
    db.expense.findUnique({
      where: { id: expenseId || "null", groupId },
      include: {
        payments: { include: { user: true } },
        splits: { include: { user: true } },
      },
    }),
  ]);

  return (
    <>
      <BalanceSummaryList
        userId={userId}
        expense={expense}
        users={group?.users || []}
      />
      <hr />
      <BalanceList expense={expense} users={group?.users || []} />
    </>
  );
};

export default Balance;
