import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { RUPPEE_SYMBOL } from "@/constants/ui";

const YourShare = async ({
  groupId,
  expenseId,
}: {
  groupId?: string | null;
  expenseId: string;
}) => {
  const { userId } = auth();
  const [users, payments, splits] = await db.$transaction([
    db.user.findMany({
      where: { groups: { some: { id: groupId || "null" } } },
    }),
    db.userPayment.findMany({ where: { expenseId } }),
    db.userSplit.findMany({ where: { expenseId } }),
  ]);

  const getSummaryList = () => {
    const u = users?.find((x) => x?.id === userId);
    if (!u) {
      return "";
    }
    const paid = payments?.find((p) => p.userId === u.id)?.amount || 0;
    const owed = splits?.find((s) => s.userId === u.id)?.amount || 0;

    if (!paid && !owed) {
      return `You are not involved`;
    }

    return `You owe ${RUPPEE_SYMBOL}${owed}`;
  };

  return <div className="text-[12px] truncate">{getSummaryList()}</div>;
};

export default YourShare;
