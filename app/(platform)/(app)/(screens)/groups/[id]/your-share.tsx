"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { yourShareInExpense } from "@/app/(platform)/(app)/_utils/expense";
import {
  toUserModel,
  useGroupLedger,
  useGroupMembers,
} from "@/lib/data/groups";

const YourShare = ({
  groupId,
  expenseId,
}: {
  groupId: string;
  expenseId: string;
}) => {
  const { user } = useAuth();
  const ledger = useGroupLedger(groupId);
  const members = useGroupMembers(groupId);

  if (!ledger.data || !members.data || !user)
    return ledger.error || members.error ? null : (
      <Skeleton className="h-3 w-28" />
    );

  const expense = ledger.data.find((e) => e.id === expenseId);
  const shareSummary = yourShareInExpense(
    user.uid,
    members.data.map(toUserModel),
    expense?.payments ?? [],
    expense?.splits ?? [],
  );

  return (
    <div className="text-[12px] truncate">
      <div className={shareSummary.color}>{shareSummary.text}</div>
    </div>
  );
};

export default YourShare;
