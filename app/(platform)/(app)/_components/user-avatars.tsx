import { ListItem } from "@/components/list-item";
import { User } from "@prisma/client";
import Image from "next/image";

type UserAvatarsProps = { users?: User[] | null; action: React.ReactNode };

export const UserAvatars = (props: UserAvatarsProps) => {
  const { users, action } = props;

  return !users ? null : (
    <div className="flex h-10 relative w-full">
      {users?.map((u, index) => (
        <Image
          key={u.id}
          alt="profile pic "
          width={40}
          height={40}
          title={u.name || ""}
          className="rounded-full border-secondary border-2 absolute"
          style={{ zIndex: `${index + 1}`, left: `${index * 28}px` }}
          src={u.profile_image_url || ""}
        />
      ))}
      <div
        className="absolute"
        style={{ left: `${(users?.length || 0) * 28 + 32}px` }}
      >
        {action}
      </div>
    </div>
  );
};
