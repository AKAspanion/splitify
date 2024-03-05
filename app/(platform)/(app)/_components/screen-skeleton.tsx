import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import React from "react";

export const ScreenSkeleton = ({
  card,
  noPad = false,
}: {
  card?: React.ReactNode;
  noPad?: boolean;
}) => {
  return (
    <div className={cn({ "px-8 py-6": !noPad })}>
      <div className="flex justify-between items-center gap-4 pb-6">
        <Skeleton className="w-[100px] h-8 rounded-md" />
        <div className="flex justify-between gap-4">
          <Skeleton className="w-10 h-10 rounded-md" />
          <Skeleton className="w-10 h-10 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((g) => {
          return (
            <React.Fragment key={g}>
              {card ? card : <SkeletonCard />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const SkeletonCard = () => {
  return (
    <div className="flex space-y-3 gap-4">
      <Skeleton className="h-[80px] w-[80px] rounded" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-[150px]" />
        <Skeleton className="h-3 w-[100px]" />
        <Skeleton className="h-3 w-[80px]" />
      </div>
    </div>
  );
};
