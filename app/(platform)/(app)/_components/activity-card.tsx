import { ListItem } from "@/components/list-item";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { relativeDate } from "@/utils/date";
import { Activity } from "@prisma/client";
import {
  MessageSquareText,
  FileMinus2,
  FilePlus2,
  UserRoundMinus,
  UserRoundPlus,
  UserPlus,
  UserMinus,
  Info,
} from "lucide-react";

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

  // const isCurrUser = currUserId !== activity?.userId;

  const getIcon = () => {
    const type = activity?.type;
    switch (type) {
      case "GROUP_PLUS":
        return <UserRoundPlus />;
      case "GROUP_MINUS":
        return <UserRoundMinus />;
      case "MEMBER_PLUS":
        return <UserPlus />;
      case "MEMBER_MINUS":
        return <UserMinus />;
      case "EXPENSE_PLUS":
        return <FilePlus2 />;
      case "EXPENSE_MINUS":
        return <FileMinus2 />;
      case "USER":
        return <MessageSquareText />;
      default:
        return <MessageSquareText />;
    }
  };

  return !activity ? null : (
    <div>
      <div className={cn("flex justify-between items-center gap-4")}>
        <div className="flex items-center gap-4">
          <div className="w-6 h-6">{getIcon()}</div>
          <div className="flex items-center">
            <div className="flex flex-col">
              <div className="font-normal text-sm">{activity.message}</div>
              <div className="text-xs font-light">
                <div className="capitalize">{relativeDate(activityDate)}</div>
              </div>
            </div>
          </div>
        </div>
        {actions}
      </div>
    </div>
  );
};

export const ActivityCardLoading = () => {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-3 w-[60px]" />
      </div>
    </div>
  );
};
