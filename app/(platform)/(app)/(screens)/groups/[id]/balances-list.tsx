"use client";
import { Switch } from "@/components/ui/switch";
import { calcGroupSplits } from "@/app/(platform)/(app)/_utils/calculation";
import { ExpenseWithPaymentWithSplit, GroupWIthUsers } from "@/types/shared";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";

export const BalancesList = ({
  group,
  expenses,
  onlyList = false,
}: {
  onlyList?: boolean;
  group: GroupWIthUsers | null;
  expenses: ExpenseWithPaymentWithSplit[] | null;
}) => {
  const { user } = useUser();
  const [detailed, setDetailed] = useState(false);

  const balanceList = useMemo(
    () =>
      user?.id
        ? calcGroupSplits(
            user?.id,
            expenses || [],
            group?.users || [],
            detailed,
          ) || []
        : [],
    [detailed, expenses, group?.users, user?.id],
  );

  const balances = useMemo(
    () => (onlyList ? balanceList.slice(0, 2) : balanceList),
    [balanceList, onlyList],
  );

  const handleCheck = () => {
    setDetailed((s) => !s);
  };

  return (
    <div>
      <div className="font-semibold text-normal flex flex-wrap-reverse justify-end gap-3 items-end">
        <div className="flex flex-col gap-2">
          {balances?.map((s, i) => (
            <div className="font-medium" key={i}>
              {s}
            </div>
          ))}
        </div>
        <div className="flex-1" />
        {onlyList ? null : (
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="airplane-mode" className="text-sm">
                Detailed
              </Label>
              <Switch
                checked={detailed}
                onCheckedChange={handleCheck}
                id="airplane-mode"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
