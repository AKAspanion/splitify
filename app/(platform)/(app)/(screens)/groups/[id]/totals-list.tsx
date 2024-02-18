"use client";

import { RUPPEE_SYMBOL } from "@/constants/ui";
import { ExpenseWithPaymentWithSplit } from "@/types/shared";
import { useMemo } from "react";
import { evaluateTotals } from "../../../_utils/calculation";
import { useUser } from "@clerk/nextjs";

export const TotalsList = ({
  expenses,
}: {
  expenses: ExpenseWithPaymentWithSplit[] | null;
}) => {
  const { user } = useUser();
  const data = useMemo(
    () => evaluateTotals(expenses, user?.id),
    [expenses, user?.id],
  );

  return (
    <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <div className="">Total group spending</div>
        <div className="font-medium text-xl">
          {RUPPEE_SYMBOL}
          {data?.totals}
        </div>
      </div>
      <div>
        <div>Total you paid for</div>
        <div className="font-medium text-xl">
          {RUPPEE_SYMBOL}
          {data?.yours}
        </div>
      </div>
      {/* <div>
        <div>Total group spending</div>
        <div>-</div>
      </div> */}
    </div>
  );
};
