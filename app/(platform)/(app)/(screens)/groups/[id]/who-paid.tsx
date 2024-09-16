"use client";

import { useQuery } from "@tanstack/react-query";
import { GET_METHOD_CALLBACK } from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrencySymbol } from "@/utils/currency";

const WhoPaid = ({
  expenseId,
  amount,
  currency = "",
}: {
  expenseId: string;
  amount: number;
  currency?: string | null;
}) => {
  const { data: whoPaid, isLoading } = useQuery<string>({
    queryKey: [`group-${expenseId}-who-paid-${amount}`],
    queryFn: GET_METHOD_CALLBACK(`/api/app/expense/${expenseId}/who-paid`, {}),
    enabled: true,
  });

  const symbol = getCurrencySymbol(currency || "");

  let whoPaidValue = whoPaid;

  if (amount) {
    whoPaidValue = whoPaidValue + ` ${symbol}${amount}`;
  }

  return isLoading ? (
    <Skeleton className="h-3 w-20" />
  ) : (
    <div>{whoPaidValue}</div>
  );
};

export default WhoPaid;
