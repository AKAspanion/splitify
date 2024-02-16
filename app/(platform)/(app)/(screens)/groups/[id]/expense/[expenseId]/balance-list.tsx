"use client";
import { Switch } from "@/components/ui/switch";
import { calcExpenseSplits } from "@/app/(platform)/(app)/_utils/calculation";
import { ExpenseWithPaymentWithSplit, GroupWIthUsers } from "@/types/shared";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";

export const BalanceList = ({
  expense,
  group,
}: {
  group: GroupWIthUsers | null;
  expense: ExpenseWithPaymentWithSplit | null;
}) => {
  const { user } = useUser();
  const [detailed, setDetailed] = useState(false);
  const balance = useMemo(() => {
    return user?.id
      ? calcExpenseSplits(
          user?.id,
          expense,
          group?.users || [],
          expense?.payments || [],
          expense?.splits || [],
          detailed,
        ) || []
      : [];
  }, [detailed, expense, group?.users, user?.id]);

  const handleCheck = () => {
    setDetailed((s) => !s);
  };

  return (
    <div>
      <div className="pb-3 font-semibold text-normal flex justify-between gap-6 items-center">
        <div>Balance</div>
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
      </div>
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
