import { db } from "@/lib/db";
import { UserAvatars } from "@/app/(platform)/(app)/_components/user-avatars";
import { PlusCircleIcon, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { ListItem } from "@/components/list-item";
import { urlEncode } from "@/utils/func";
import { auth } from "@clerk/nextjs";

const GroupMembers = async ({
  id,
  backTo,
  showAll,
}: {
  id: string;
  backTo: string;
  showAll?: boolean;
}) => {
  const { userId } = auth();
  const take = showAll ? undefined : 4;
  const users = await db.user.findMany({
    take,
    where: { groups: { some: { id: id || "null" } } },
  });

  const usersLength = !users ? 0 : users.length;

  const noData = usersLength === 0;

  const loadMore = urlEncode({
    path: `/groups/${id}/settings`,
    query: { back: backTo, show: "all" },
  });

  const showLoadMore = usersLength <= 3 ? false : !showAll;

  const backUrl = urlEncode({ path: `/groups/${id}/settings` });

  return noData ? null : (
    <div>
      <div className="pt-6 pb-3 font-semibold text-normal">Group members</div>
      <div className="pb-6 flex flex-col gap-4">
        <Link href={`/groups/${id}/add-member`}>
          <ListItem title="Add members to group" icon={<UserPlus />} />
        </Link>
        {users?.map((d) => (
          <Link href={`/friends/${d.id}?back=${backUrl}`} key={d.id}>
            <UserCard showMail={false} currUserId={userId || ""} user={d} />
          </Link>
        ))}
      </div>
      {showLoadMore ? (
        <>
          <Link className="text-sparkle underline text-sm" href={loadMore}>
            Show all
          </Link>

          <div className="h-6" />
        </>
      ) : null}
    </div>
  );
};

export default GroupMembers;
