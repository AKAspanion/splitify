"use client";
import { replaceUserWithYou } from "@/app/(platform)/(app)/_utils/user";
import { Skeleton } from "@/components/ui/skeleton";
import useExpense from "@/hooks/use-expense";
import { getCurrencySymbol } from "@/utils/currency";
import { relativeFormatDate } from "@/utils/date";
import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";

const ExpenseAddedBy = ({
  groupId,
  expenseId,
}: {
  groupId: string;
  expenseId: string;
}) => {
  const { user } = useUser();
  const { expense, loading } = useExpense(expenseId, groupId);
  const addedBy = useMemo(
    () => replaceUserWithYou(user?.id, expense?.user?.id, expense?.user?.name),
    [expense?.user?.id, expense?.user?.name, user?.id],
  );

  const createDate = expense?.createdAt
    ? new Date(expense?.createdAt).toString()
    : "";

  const symbol = getCurrencySymbol(expense?.currency);

  return expense ? (
    <div>
      <div className="font-bold text-lg">
        {symbol} {expense?.amount}
      </div>
      <div className="font-thin text-sm">
        Added by {addedBy}, {relativeFormatDate(createDate)}
      </div>
    </div>
  ) : (
    <div>
      <Skeleton className="h-7 w-[80px]" />
      <Skeleton className="h-5 mt-1 w-[120px]" />
    </div>
  );
};

export default ExpenseAddedBy;
