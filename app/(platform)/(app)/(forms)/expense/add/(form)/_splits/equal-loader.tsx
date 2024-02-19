import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export const EqualLoader = () => {
  return (
    <div className="flex flex-col gap-6 pt-3 pb-6">
      {[1, 2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <div className="flex justify-between items-center gap-4">
            <div className="flex justify-start items-center gap-4">
              {i === 4 ? null : <Skeleton className="rounded-full w-10 h-10" />}
              <Skeleton className="w-[100px] h-5" />
            </div>
            <Skeleton className="w-4 h-4 rounded-md" />
          </div>
          {i === 3 ? <hr /> : null}
        </React.Fragment>
      ))}
      <div className="flex items-center justify-center flex-col gap-1">
        <Skeleton className="w-[100px] h-4" />
        <Skeleton className="w-[60px] h-4" />
      </div>
    </div>
  );
};
