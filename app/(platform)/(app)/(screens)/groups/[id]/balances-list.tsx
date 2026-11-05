"use client";
import { calcGroupSplits } from "@/app/(platform)/(app)/_utils/calculation";
import type { User } from "@/types/shared";
import type { ExpenseWithPaymentWithSplit } from "@/types/shared";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const BalancesList = ({
  groupId,
  users,
  expenses,
  onlyList = false,
}: {
  onlyList?: boolean;
  groupId: string;
  users: User[];
  expenses: ExpenseWithPaymentWithSplit[] | null;
}) => {
  const { user } = useAuth();
  const [detailed] = useState(false);

  const uid = user?.uid;

  const balanceList = useMemo(
    () =>
      uid ? calcGroupSplits(uid, expenses || [], users, detailed) || [] : [],
    [detailed, expenses, users, uid],
  );

  const balances = useMemo(
    () => (onlyList ? balanceList.slice(0, 2) : balanceList),
    [balanceList, onlyList],
  );

  const noDataText = useMemo(() => {
    let text = "";
    if (!expenses?.length) {
      text = "No expenses yet";
    } else if (!balanceList?.length) {
      text = "All settled up";
    }
    return text;
  }, [balanceList?.length, expenses?.length]);

  return (
    <div>
      <div className="font-semibold text-normal flex flex-wrap-reverse justify-end gap-3 items-end">
        <div
          className={cn("flex flex-col", {
            "gap-1": onlyList,
            "gap-2": !onlyList,
          })}
        >
          {noDataText
            ? noDataText
            : balances?.map((s, i) => (
                <div
                  className="font-medium flex w-full gap-4 items-center"
                  key={i}
                >
                  <div className="font-medium" key={i}>
                    {s.message}
                  </div>
                  <Link
                    href={`/groups/${groupId}/settle?user1Id=${s.user1Id}&user2Id=${s.user2Id}&owes=${s.owes}`}
                  >
                    <Badge size="sm">Settle</Badge>
                  </Link>
                </div>
              ))}
        </div>
        <div className="flex-1" />
      </div>
    </div>
  );
};
