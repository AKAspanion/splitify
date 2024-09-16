"use client";
import { useQuery } from "@tanstack/react-query";
import { GET_METHOD_CALLBACK } from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";

const YourShare = ({
  groupId,
  expenseId,
}: {
  groupId?: string | null;
  expenseId: string;
}) => {
  const { data: shareSummary, isLoading } = useQuery<any>({
    queryKey: [`group-${groupId}-your-share-${expenseId}`],
    queryFn: GET_METHOD_CALLBACK(
      `/api/app/group/${groupId}/your-share/${expenseId}`,
      {},
    ),
    enabled: true,
  });

  return isLoading ? (
    <Skeleton className="h-3 w-28" />
  ) : (
    <div className="text-[12px] truncate">
      <div className={shareSummary?.color}>{shareSummary?.text || ""}</div>
    </div>
  );
};

export default YourShare;
