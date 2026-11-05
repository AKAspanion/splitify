"use client";

import { RUPEE_SYMBOL } from "@/constants/ui";
import { ExpenseWithPaymentWithSplit } from "@/types/shared";
import { useMemo } from "react";
import { evaluateTotals } from "@/app/(platform)/(app)/_utils/calculation";
import { useAuth } from "@/hooks/use-auth";
import { fixedNum } from "@/utils/validate";

export const TotalsList = ({
  expenses,
}: {
  expenses: ExpenseWithPaymentWithSplit[] | null;
}) => {
  const { user } = useAuth();
  const data = useMemo(
    () => evaluateTotals(expenses, user?.uid),
    [expenses, user?.uid],
  );

  return (
    <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <div className="">Total group spending</div>
        <div className="font-medium text-xl">
          {RUPEE_SYMBOL}
          {fixedNum(data?.totals)}
        </div>
      </div>
      <div>
        <div>Total you paid for</div>
        <div className="font-medium text-xl">
          {RUPEE_SYMBOL}
          {fixedNum(data?.yours)}
        </div>
      </div>
    </div>
  );
};
