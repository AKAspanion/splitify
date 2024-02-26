import { ListItem } from "@/components/list-item";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { relativeDate } from "@/utils/date";
import { Activity } from "@prisma/client";
import Image from "next/image";

type ActivityCardProps = {
  currUserId: string | null;
  activity: Activity | null;
  disabled?: boolean;
  actions?: React.ReactNode;
};

export const ActivityCard = (props: ActivityCardProps) => {
  const { currUserId, disabled, activity, actions } = props;

  const activityDate = activity?.createdAt
    ? new Date(activity?.createdAt).toString()
    : "";

  const isCurrUser = currUserId !== activity?.userId;

  return !activity ? null : (
    <div className={cn()}>
      <ListItem
        title={activity.message}
        disabled={disabled}
        actions={actions}
        subtitle={
          <div className="capitalize">{relativeDate(activityDate)}</div>
        }
      />
    </div>
  );
};

export const ActivityCardLoading = () => {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-3 w-[60px]" />
        </div>
      </div>
      <Skeleton className="h-10 w-10 rounded-md sm:invisible" />
    </div>
  );
};
