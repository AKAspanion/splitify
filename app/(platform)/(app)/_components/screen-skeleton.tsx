import { Skeleton } from "@/components/ui/skeleton";

export const ScreenSkeleton = () => {
  return (
    <div className="px-8 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((g) => {
          return <SkeletonCard key={g} />;
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
