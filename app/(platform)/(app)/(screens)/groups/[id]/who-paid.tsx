"use client";

import { RUPEE_SYMBOL } from "@/constants/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { whoPaidExpense } from "@/app/(platform)/(app)/_utils/expense";
import {
  toUserModel,
  useGroupLedger,
  useGroupMembers,
} from "@/lib/data/groups";

const WhoPaid = ({
  groupId,
  expenseId,
  amount,
}: {
  groupId: string;
  expenseId: string;
  amount: number;
}) => {
  const { user } = useAuth();
  const ledger = useGroupLedger(groupId);
  const members = useGroupMembers(groupId);

  if (!ledger.data || !members.data)
    return ledger.error || members.error ? null : (
      <Skeleton className="h-3 w-20" />
    );

  const payments = (
    ledger.data.find((e) => e.id === expenseId)?.payments ?? []
  ).map((p) => {
    const member = members.data.find((m) => m.id === p.userId);
    return { ...p, user: member ? toUserModel(member) : p.user };
  });

  let whoPaidValue = whoPaidExpense(payments, user?.uid);

  if (amount) {
    whoPaidValue = whoPaidValue + ` ${RUPEE_SYMBOL}${amount}`;
  }

  return <div>{whoPaidValue}</div>;
};

export default WhoPaid;
