"use client";
import { Switch } from "@/components/ui/switch";
import { calcExpenseSplits } from "@/app/(platform)/(app)/_utils/calculation";
import { ExpenseWithPaymentWithSplit } from "@/types/shared";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { User } from "@prisma/client";

export const BalanceList = ({
  expense,
  users,
}: {
  users: User[];
  expense: ExpenseWithPaymentWithSplit | null;
}) => {
  const { user } = useUser();
  const [detailed, setDetailed] = useState(false);
  const balanceList = useMemo(() => {
    return user?.id
      ? calcExpenseSplits(
          user?.id,
          expense,
          users || [],
          expense?.payments || [],
          expense?.splits || [],
          detailed,
        ) || []
      : [];
  }, [detailed, expense, users, user?.id]);

  const noDataText = useMemo(() => {
    let text = "";
    if (!balanceList?.length) {
      text = "No balances";
    }
    return text;
  }, [balanceList?.length]);

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
      {noDataText ? <div className="pb-6">{noDataText}</div> : null}
      <div className="flex flex-col gap-2">
        {balanceList?.map((s, i) => (
          <div className="text-sm font-medium opacity-90" key={i}>
            {s.message}
          </div>
        ))}
      </div>
    </div>
  );
};
