"use client";
import { replaceUserWithYou } from "@/app/(platform)/(app)/_utils/user";
import { Skeleton } from "@/components/ui/skeleton";
import { RUPEE_SYMBOL } from "@/constants/ui";
import useExpense from "@/hooks/use-expense";
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

  return expense ? (
    <div>
      <div className="font-bold text-lg">
        {RUPEE_SYMBOL} {expense?.amount}
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
