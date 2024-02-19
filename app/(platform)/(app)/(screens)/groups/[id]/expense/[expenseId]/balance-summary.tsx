import { db } from "@/lib/db";
import { ExpenseWithPaymentWithSplit } from "@/types/shared";
import { auth } from "@clerk/nextjs";
import BalanceSummaryList from "./balance-summary-list";

const Balance = async ({
  expense,
  groupId,
}: {
  groupId: string;
  expense: ExpenseWithPaymentWithSplit | null;
}) => {
  const { userId } = auth();
  const group = await db.group.findUnique({
    where: { id: groupId, users: { some: { id: userId || "null" } } },
    include: { users: true },
  });

  return <BalanceSummaryList userId={userId} expense={expense} group={group} />;
};

export default Balance;
