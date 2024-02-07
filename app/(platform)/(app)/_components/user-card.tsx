import { ListItem } from "@/components/list-item";
import { User } from "@prisma/client";
import Image from "next/image";

type UserCardProps = {
  user: User | null;
  actions?: React.ReactNode;
};

export const UserCard = (props: UserCardProps) => {
  const { user, actions } = props;

  return !user ? null : (
    <ListItem
      actions={actions}
      title={user?.name || "-"}
      subtitle={user?.email}
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
