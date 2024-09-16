"use client";

import { RUPEE_SYMBOL } from "@/constants/ui";
import { useQuery } from "@tanstack/react-query";
import { GET_METHOD_CALLBACK } from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";

const WhoPaid = ({
  expenseId,
  amount,
}: {
  expenseId: string;
  amount: number;
}) => {
  const { data: whoPaid, isLoading } = useQuery<string>({
    queryKey: [`group-${expenseId}-who-paid-${amount}`],
    queryFn: GET_METHOD_CALLBACK(`/api/app/expense/${expenseId}/who-paid`, {}),
    enabled: true,
  });

  let whoPaidValue = whoPaid;

  if (amount) {
    whoPaidValue = whoPaidValue + ` ${RUPEE_SYMBOL}${amount}`;
  }

  return isLoading ? (
    <Skeleton className="h-3 w-20" />
  ) : (
    <div>{whoPaidValue}</div>
  );
};

export default WhoPaid;
