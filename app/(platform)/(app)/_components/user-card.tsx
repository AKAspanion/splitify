import { User } from "@prisma/client";
import Image from "next/image";

type UserCardProps = {
  user: User | null;
  actions?: React.ReactNode;
};

export const UserCard = (props: UserCardProps) => {
  const { user, actions } = props;

  return !user ? null : (
    <div className="flex justify-between items-center gap-4">
      <div className="flex items-center gap-4">
        <Image
          alt="profile pic"
          width={40}
          height={40}
          className="rounded-full"
          src={user.image_url || ""}
        />
        <div className="flex items-center">
          <div className="flex flex-col">
            <div className="font-normal text-sm">{user?.name || "-"}</div>
            {user?.email ? (
              <div className="text-xs font-light">{user?.email}</div>
            ) : null}
          </div>
        </div>
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
};
