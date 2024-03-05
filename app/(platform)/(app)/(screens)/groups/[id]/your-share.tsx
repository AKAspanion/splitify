import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { RUPPEE_SYMBOL } from "@/constants/ui";
import { fixedNum } from "@/utils/validate";

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

    const normalizedAmount = fixedNum(paid - owed);

    return normalizedAmount > 0 ? (
      <div className="text-sparkle">
        You get back {RUPPEE_SYMBOL}
        {Math.abs(normalizedAmount)}
      </div>
    ) : (
      <div className="text-destructive">
        You owe {RUPPEE_SYMBOL}
        {owed}
      </div>
    );
  };

  return <div className="text-[12px] truncate">{getSummaryList()}</div>;
};

export default YourShare;
