import { calcGroupSplits } from "@/app/(platform)/(app)/_utils/calculation";
import { db } from "@/lib/db";
import { ExpenseWithPaymentWithSplit } from "@/types/shared";
import { auth } from "@clerk/nextjs";
import { BalanceList } from "./balance-list";

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

  return <BalanceList expense={expense} group={group} />;
};

export default Balance;
