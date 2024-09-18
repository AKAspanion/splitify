"use client";
import { calcExpenseSplits } from "@/app/(platform)/(app)/_utils/calculation";
import { ExpenseWithPaymentWithSplit } from "@/types/shared";
import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { User } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

export const BalanceList = ({
  expense,
  users,
}: {
  users: User[];
  expense: ExpenseWithPaymentWithSplit | null;
}) => {
  const { user } = useUser();
  const [detailed] = useState(false);

  const { data: balanceList } = useQuery({
    queryKey: ["expense-balance-list"],
    queryFn: async () => {
      return user?.id
        ? (await calcExpenseSplits(
            user?.id,
            expense,
            users || [],
            expense?.payments || [],
            expense?.splits || [],
            detailed,
          )) || []
        : [];
    },
    enabled: true,
  });

  const noDataText = useMemo(() => {
    let text = "";
    if (!balanceList?.length) {
      text = "No balances";
    }
    return text;
  }, [balanceList?.length]);

  // const handleCheck = () => {
  //   setDetailed((s) => !s);
  // };

  return (
    <div>
      <div className="pb-3 font-semibold text-normal flex justify-between gap-6 items-center">
        <div>Balance</div>
        <div>
          {/* <div className="flex items-center space-x-2">
            <Label htmlFor="airplane-mode" className="text-sm">
              Detailed
            </Label>
            <Switch
              checked={detailed}
              onCheckedChange={handleCheck}
              id="airplane-mode"
            />
          </div> */}
        </div>
      </div>
      {noDataText ? <div className="pb-6">{noDataText}</div> : null}
      <div className="flex flex-col gap-2">
        {balanceList?.map((b, i) => (
          <div className="text-sm font-medium opacity-90" key={i}>
            {b.message}
          </div>
        ))}
      </div>
    </div>
  );
};
