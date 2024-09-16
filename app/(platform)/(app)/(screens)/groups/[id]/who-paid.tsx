"use client";

import { whoPaidExpense } from "@/app/(platform)/(app)/_utils/expense";
import { useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { UserPayment } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { GET_METHOD_CALLBACK } from "@/utils/api";

const WhoPaid = ({
  expenseId,
  amount,
}: {
  expenseId: string;
  amount: number;
}) => {
  const { data, isLoading } = useQuery<{ payments: UserPayment[] }>({
    queryKey: [`group-${expenseId}-who-paid`],
    queryFn: GET_METHOD_CALLBACK(`/api/app/expense/${expenseId}/who-paid`, {}),
    enabled: true,
  });

  const { user } = useUser();

  const payments = data?.payments || [];

  // const whoPaidValue = useMemo(
  //   () => whoPaid?.[expenseId],
  //   [expenseId, whoPaid],
  // );

  // const loading = useMemo(
  //   () => whoPaidLoading?.[expenseId],
  //   [expenseId, whoPaidLoading],
  // );

  const calcWhoPaid = useCallback(
    (payments: UserPayment[]) =>
      whoPaidExpense(amount, payments || [], user?.id || ""),
    [amount, user?.id],
  );

  const whoPaidValue = useMemo(() => {
    return calcWhoPaid(payments);
  }, [payments]);

  // const fetchWhoPaid = async () => {
  //   if (expenseId) {
  //     // if (loading) {
  //     //   return;
  //     // }
  //     setWhoPaidLoading(expenseId, true);
  //     const { data } = await getWhoPaid(expenseId).then((r) => r.promise);
  //     if (data) {
  //       const { payments: ps } = data;
  //       setWhoPaid(expenseId, calcWhoPaid(ps));
  //     }
  //     setWhoPaidLoading(expenseId, false);
  //   }
  // };

  // useEffect(() => {
  //   if (!whoPaidValue) {
  //     fetchWhoPaid();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return isLoading ? null : <div>{whoPaidValue}</div>;
};

export default WhoPaid;
