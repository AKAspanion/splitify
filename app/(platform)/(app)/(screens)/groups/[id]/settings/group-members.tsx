import { db } from "@/lib/db";
import { UserAvatars } from "@/app/(platform)/(app)/_components/user-avatars";
import { PlusCircleIcon, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { ListItem } from "@/components/list-item";

const GroupMembers = async ({
  id,
  take,
  userId,
}: {
  id: string;
  take?: number;
  userId: string | null;
}) => {
  const users = await db.user.findMany({
    take,
    where: { groups: { some: { id: id || "null" } } },
  });

  const noData = !users || users.length === 0;

  return noData ? null : (
    <div>
      <div className="pt-6 pb-3 font-semibold text-normal">Group members</div>
      <div className="pb-6 flex flex-col gap-4">
        <Link href={`/groups/${id}/add-member`}>
          <ListItem title="Add members to group" icon={<UserPlus />} />
        </Link>
        {users?.map((d) => (
          <UserCard
            showMail={false}
            currUserId={userId || ""}
            user={d}
            key={d.id}
          />
        ))}
      </div>
    </div>
  );
};

export default GroupMembers;
