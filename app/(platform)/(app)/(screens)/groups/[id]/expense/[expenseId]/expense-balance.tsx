import { db } from "@/lib/db";
import BalanceList from "./expense-balance-list-wrapper";
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
  const [users, payments, splits] = await db.$transaction([
    db.user.findMany({
      where: { groups: { some: { id: groupId } } },
    }),
    db.userPayment.findMany({ where: { expenseId } }),
    db.userSplit.findMany({ where: { expenseId } }),
  ]);

  return (
    <>
      <BalanceSummaryList
        userId={userId}
        payments={payments}
        splits={splits}
        users={users}
      />
      <hr />
      <BalanceList expenseId={expenseId} users={users} />
    </>
  );
};

export default Balance;
