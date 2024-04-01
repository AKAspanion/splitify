"use client";

import { RUPPEE_SYMBOL } from "@/constants/ui";
import { fixedNum } from "@/utils/validate";
import { useCallback, useEffect, useMemo } from "react";
import { getShare } from "@/actions/get-share";
import { User, UserPayment, UserSplit } from "@prisma/client";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenseStore } from "@/store/expense-provider";

const YourShare = ({
  groupId,
  expenseId,
}: {
  groupId?: string | null;
  expenseId: string;
}) => {
  const { yourShare, yourShareLoading, setYourShare, setYourShareLoading } =
    useExpenseStore((s) => s);

  const { user } = useUser();

  const summaryList = useMemo(
    () => yourShare?.[expenseId],
    [expenseId, yourShare],
  );

  const loading = useMemo(
    () => yourShareLoading?.[expenseId],
    [expenseId, yourShareLoading],
  );

  const getSummaryList = useCallback(
    (users: User[], payments: UserPayment[], splits: UserSplit[]) => {
      const u = users?.find((x) => x?.id === user?.id);
      if (!u) {
        return { text: `You are not involved`, color: "" };
      }
      const paid = payments?.find((p) => p.userId === u.id)?.amount || 0;
      const owed = splits?.find((s) => s.userId === u.id)?.amount || 0;

      if (!paid && !owed) {
        return { text: `You are not involved`, color: "" };
      }

      const normalizedAmount = fixedNum(paid - owed);

      return normalizedAmount > 0
        ? {
            text: `You get back ${RUPPEE_SYMBOL} ${Math.abs(normalizedAmount)}`,
            color: "text-sparkle",
          }
        : {
            text: `You owe ${RUPPEE_SYMBOL} ${Math.abs(owed)}`,
            color: "text-destructive",
          };
    },
    [user?.id],
  );

  const fetchShare = async () => {
    if (groupId && expenseId) {
      // if (loading) {
      //   return;
      // }

      setYourShareLoading(expenseId, true);
      const { data } = await getShare(expenseId, groupId).then(
        (r) => r.promise,
      );
      if (data) {
        const { users: us, payments: ps, splits: sps } = data;

        setYourShare(expenseId, getSummaryList(us, ps, sps));
      }
      setYourShareLoading(expenseId, false);
    }
  };

  useEffect(() => {
    if (!summaryList) {
      fetchShare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loading ? null : (
    <div className="text-[12px] truncate">
      <div className={summaryList?.color}>{summaryList?.text || ""}</div>
    </div>
  );
};

export default YourShare;
