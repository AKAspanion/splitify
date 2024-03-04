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
  BanknoteIcon,
  Minus,
  SquarePen,
  NotepadText,
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
        return <UserRoundPlus className="text-green-500" />;
      case "GROUP_MINUS":
        return <UserRoundMinus className="text-red-500" />;
      case "MEMBER_PLUS":
        return <UserPlus className="text-sparkle" />;
      case "MEMBER_MINUS":
        return <UserMinus className="text-red-500" />;
      case "EXPENSE_PLUS":
        return <FilePlus2 className="text-blue-500" />;
      case "EXPENSE_MINUS":
        return <FileMinus2 className="text-red-500" />;
      case "SETTLEMENT_PLUS":
        return <BanknoteIcon className="text-green-500" />;
      case "SETTLEMENT_MINUS":
        return (
          <div className="relative text-red-500">
            <Minus className="absolute w-10 h-10 -left-2 -top-2 -rotate-45" />
            <BanknoteIcon />
          </div>
        );
      case "GROUP_UPDATE":
        return <SquarePen className="text-blue-500" />;
      case "USER":
        return <MessageSquareText className="text-blue-500" />;
      default:
        return <NotepadText className="text-blue-500" />;
    }
  };

  const canStrikeThrough = () => {
    const type = activity?.type;
    switch (type) {
      case "GROUP_MINUS":
      case "MEMBER_MINUS":
      case "EXPENSE_MINUS":
      case "SETTLEMENT_MINUS":
        return true;
      default:
        return false;
    }
  };

  return !activity ? null : (
    <div>
      <div className={cn("flex justify-between items-center gap-4")}>
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 ml-2">{getIcon()}</div>
          <div className="flex items-center">
            <div className="flex flex-col">
              <div
                className={cn("font-normal text-sm", {
                  "line-through": canStrikeThrough(),
                })}
              >
                {activity.message}
              </div>
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
