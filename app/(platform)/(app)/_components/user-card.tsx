import { ListItem } from "@/components/list-item";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@prisma/client";
import Image from "next/image";

type UserCardProps = {
  showMail?: boolean;
  currUserId?: string;
  user: User | null;
  disabled?: boolean;
  actions?: React.ReactNode;
};

export const UserCard = (props: UserCardProps) => {
  const { currUserId, disabled, user, showMail = true, actions } = props;

  const name = currUserId === user?.id ? "You" : user?.name || "-";

  return !user ? null : (
    <ListItem
      title={name}
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
      <Skeleton className="h-10 w-10 rounded-md" />
    </div>
  );
};
