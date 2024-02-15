import { calcGroupSplits } from "@/app/(platform)/(app)/_utils/calculation";
import { db } from "@/lib/db";
import { ExpenseWithPaymentWithSplit } from "@/types/shared";
import { auth } from "@clerk/nextjs";

export const Balance = async ({
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

  const balance =
    calcGroupSplits(
      expense,
      group?.users || [],
      expense?.payments || [],
      expense?.splits || [],
    ) || [];

  return (
    <div className="">
      <div className="pb-3 font-semibold text-normal">Expense balance</div>
      <div className="flex flex-col gap-2">
        {balance?.map((s, i) => (
          <div className="text-sm font-medium opacity-90" key={i}>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
};
