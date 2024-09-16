"use client";

import useExpense from "@/hooks/use-expense";
import { BanknoteIcon } from "lucide-react";

const ExpenseClient = ({
  groupId,
  expenseId,
}: {
  expenseId: string;
  groupId: string;
}) => {
  const { expense } = useExpense(expenseId, groupId);

  const isSettlement = expense?.tag === "SETTLEMENT";

  return expense ? (
    <>
      {isSettlement ? (
        <div className="flex items-center gap-6">
          <BanknoteIcon className="w-10 h-10 text-green-500" />
          <div>{expense?.description}</div>
        </div>
      ) : null}
    </>
  ) : null;
};

export default ExpenseClient;
