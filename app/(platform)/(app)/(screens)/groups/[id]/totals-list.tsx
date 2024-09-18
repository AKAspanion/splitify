"use client";

import { ExpenseWithPaymentWithSplit, GroupWIthUsers } from "@/types/shared";
import { evaluateTotals } from "@/app/(platform)/(app)/_utils/calculation";
import { useUser } from "@clerk/nextjs";
import { fixedNum } from "@/utils/validate";
import { useQuery } from "@tanstack/react-query";
import { getCurrencySymbol } from "@/utils/currency";
import { CurrencyPicker } from "./currency-picker";
import { useCallback, useState } from "react";

export const TotalsList = ({
  group,
  expenses,
}: {
  group: GroupWIthUsers | null;
  expenses: ExpenseWithPaymentWithSplit[] | null;
}) => {
  const { user } = useUser();

  const [currency, setCurrency] = useState(group?.currency || "inr");

  const { data, isLoading } = useQuery<{
    totals?: number;
    yours?: number;
  }>({
    queryKey: [`group-totals-list-${group?.id || ""}`, currency],
    queryFn: async () => {
      return user?.id
        ? (await evaluateTotals(expenses, user?.id, currency)) || {}
        : {};
    },
    enabled: true,
  });

  const symbol = getCurrencySymbol(currency);

  const onCurrencyChange = useCallback((c: string) => {
    setCurrency(() => c);
  }, []);

  return (
    <div className="py-6">
      <div className="mb-3">
        <CurrencyPicker
          group={group}
          currency={currency}
          onCurrencyChange={onCurrencyChange}
        />
      </div>
      <div className=" grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="">Total group spending</div>
          <div className="font-medium text-xl">
            {symbol}
            {fixedNum(data?.totals || 0)}
          </div>
        </div>
        <div>
          <div>Total you paid for</div>
          <div className="font-medium text-xl">
            {symbol}
            {fixedNum(data?.yours || 0)}
          </div>
        </div>
        {/* <div>
        <div>Total group spending</div>
        <div>-</div>
      </div> */}
      </div>
    </div>
  );
};
