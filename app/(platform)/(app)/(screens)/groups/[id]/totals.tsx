"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useGroupLedger } from "@/lib/data/groups";
import { LoadError } from "./_components/group-states";
import { TotalsList } from "./totals-list";

const Totals = ({ id }: { id: string }) => {
  const { data: expenses, error, refetch } = useGroupLedger(id);

  if (error) return <LoadError error={error} onRetry={() => refetch()} />;

  if (!expenses)
    return (
      <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-6 w-[90px]" />
          </div>
        ))}
      </div>
    );

  return <TotalsList expenses={expenses} />;
};

export default Totals;
