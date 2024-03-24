"use client";

import { whoPaidExpense } from "../../../_utils/expense";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getWhoPaid } from "@/actions/get-who-paid";
import { UserPaymentWithUser } from "@/types/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPayment } from "@prisma/client";
import { useExpenseStore } from "@/lib/store/expense-provider";

const WhoPaid = ({
  expenseId,
  amount,
}: {
  expenseId: string;
  amount: number;
}) => {
  const { whoPaid, whoPaidLoading, setWhoPaid, setWhoPaidLoading } =
    useExpenseStore((s) => s);

  const { user } = useUser();

  const whoPaidValue = useMemo(
    () => whoPaid?.[expenseId],
    [expenseId, whoPaid],
  );

  const loading = useMemo(
    () => whoPaidLoading?.[expenseId],
    [expenseId, whoPaidLoading],
  );

  const calcWhoPaid = useCallback(
    (payments: UserPayment[]) =>
      whoPaidExpense(amount, payments || [], user?.id || ""),
    [amount, user?.id],
  );

  const fetchWhoPaid = async () => {
    if (expenseId) {
      if (loading) {
        return;
      }
      setWhoPaidLoading(expenseId, true);
      const { data } = await getWhoPaid(expenseId);
      if (data) {
        const { payments: ps } = data;
        setWhoPaid(expenseId, calcWhoPaid(ps));
      }
      setWhoPaidLoading(expenseId, false);
    }
  };

  useEffect(() => {
    if (!whoPaidValue) {
      fetchWhoPaid();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loading ? null : <div>{whoPaidValue}</div>;
};

export default WhoPaid;
