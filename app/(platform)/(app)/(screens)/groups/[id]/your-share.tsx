"use client";

import { RUPPEE_SYMBOL } from "@/constants/ui";
import { fixedNum } from "@/utils/validate";
import { useEffect, useMemo, useState } from "react";
import { getShare } from "@/actions/get-share";
import { User, UserPayment, UserSplit } from "@prisma/client";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

const YourShare = ({
  groupId,
  expenseId,
}: {
  groupId?: string | null;
  expenseId: string;
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [splits, setSplits] = useState<UserSplit[]>([]);
  const [payments, setPayments] = useState<UserPayment[]>([]);

  const summaryList = useMemo(() => {
    const u = users?.find((x) => x?.id === user?.id);
    if (!u) {
      return "";
    }
    const paid = payments?.find((p) => p.userId === u.id)?.amount || 0;
    const owed = splits?.find((s) => s.userId === u.id)?.amount || 0;

    if (!paid && !owed) {
      return `You are not involved`;
    }

    const normalizedAmount = fixedNum(paid - owed);

    return normalizedAmount > 0 ? (
      <div className="text-sparkle">
        You get back {RUPPEE_SYMBOL}
        {Math.abs(normalizedAmount)}
      </div>
    ) : (
      <div className="text-destructive">
        You owe {RUPPEE_SYMBOL}
        {owed}
      </div>
    );
  }, [payments, splits, user?.id, users]);

  const fetchShare = async () => {
    if (groupId && expenseId) {
      setLoading(true);
      const { data } = await getShare(expenseId, groupId);
      if (data) {
        const { users: us, payments: ps, splits: sps } = data;
        setUsers(() => [...(us || [])]);
        setPayments(() => [...(ps || [])]);
        setSplits(() => [...(sps || [])]);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, expenseId]);

  return loading ? (
    <Skeleton className="h-3 w-[120px]" />
  ) : (
    <div className="text-[12px] truncate">{summaryList}</div>
  );
};

export default YourShare;
