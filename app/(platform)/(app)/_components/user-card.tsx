import { ListItem } from "@/components/list-item";
import { Skeleton } from "@/components/ui/skeleton";
import { getYouKeyword } from "@/utils/validate";
import { User } from "@prisma/client";
import { AlertOctagon } from "lucide-react";
import Image from "next/image";

type UserCardProps = {
  showMail?: boolean;
  currUserId?: string;
  user: Partial<User | null>;
  disabled?: boolean;
  actions?: React.ReactNode;
};

export const UserCard = (props: UserCardProps) => {
  const { currUserId, disabled, user, showMail = true, actions } = props;

  const name = getYouKeyword(
    currUserId || "null",
    user?.id || "lol",
    user?.firstName || user?.name || "-",
  );

  return !user ? null : (
    <ListItem
      title={
        <div className="flex items-center gap-2">
          {name}
          {!user?.fromClerk ? (
            <AlertOctagon className="w-3 h-3 text-yellow-500" />
          ) : null}
        </div>
      }
      disabled={disabled}
      actions={actions}
      subtitle={showMail ? user?.email : ""}
      icon={
        <Image
          alt="profile pic"
          width={40}
          height={40}
          className="rounded-full"
          src={user.profile_image_url || ""}
        />
      }
    />
  );
};

export const UserCardLoading = () => {
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
