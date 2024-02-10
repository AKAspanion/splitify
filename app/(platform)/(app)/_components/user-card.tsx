import { ListItem } from "@/components/list-item";
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
  const { currUserId,disabled, user, showMail = true, actions } = props;

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
