"use client";
import { replaceUserWithYou } from "@/app/(platform)/(app)/_utils/user";
import { RUPEE_SYMBOL } from "@/constants/ui";
import type { ExpenseDetail } from "@/lib/data/expenses";
import { relativeFormatDate } from "@/utils/date";

const ExpenseAddedBy = ({
  expense,
  addedById,
  addedByName,
  userId,
}: {
  expense: ExpenseDetail;
  addedById: string;
  addedByName?: string | null;
  userId?: string | null;
}) => {
  const addedBy = replaceUserWithYou(userId, addedById, addedByName);
  const createDate = new Date(expense.createdAt).toString();

  return (
    <div>
      <div className="font-bold text-lg">
        {RUPEE_SYMBOL} {expense.amount}
      </div>
      <div className="font-thin text-sm">
        Added by {addedBy}, {relativeFormatDate(createDate)}
      </div>
    </div>
  );
};

export default ExpenseAddedBy;
