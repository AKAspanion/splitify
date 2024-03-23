"use client";

import { whoPaidExpense } from "../../../_utils/expense";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getWhoPaid } from "@/actions/get-who-paid";
import { UserPaymentWithUser } from "@/types/shared";
import { Skeleton } from "@/components/ui/skeleton";

const WhoPaid = ({
  expenseId,
  amount,
}: {
  expenseId: string;
  amount: number;
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<UserPaymentWithUser[]>([]);

  const whoPaid = useMemo(
    () => whoPaidExpense(amount, payments || [], user?.id || ""),
    [amount, payments, user?.id],
  );

  const fetchWhoPaid = async () => {
    if (expenseId) {
      setLoading(true);
      const { data } = await getWhoPaid(expenseId);
      if (data) {
        const { payments: ps } = data;
        setPayments(() => [...(ps || [])]);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhoPaid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseId]);

  return loading ? (
    <Skeleton className="h-4 w-[120px]" />
  ) : (
    <div>{whoPaid}</div>
  );
};

export default WhoPaid;
