import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const BalancesLoader = ({
  onlyList,
  dense,
}: {
  onlyList?: boolean;
  dense?: boolean;
}) => {
  return (
    <div
      className={cn("flex justify-between", {
        "gap-1": dense,
        "gap-6": !dense,
      })}
    >
      <div
        className={cn("grid grid-cols-1", {
          "pb-0 gap-1": dense,
          "pb-8 gap-2": !dense,
        })}
      >
        {[1, 2].map((i) => (
          <Skeleton
            key={i}
            className={cn("mt-1 w-[180px]", { "h-3": dense, "h-5": !dense })}
          />
        ))}
      </div>
      {onlyList ? null : <Skeleton className="h-6 mb-3 w-[60px]" />}
    </div>
  );
};
