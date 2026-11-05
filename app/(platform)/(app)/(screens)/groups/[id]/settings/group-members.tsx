"use client";

import { PlusCircleIcon, UserPlus } from "lucide-react";
import Link from "next/link";
import {
  UserCard,
  UserCardLoading,
} from "@/app/(platform)/(app)/_components/user-card";
import { ListItem } from "@/components/list-item";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { toUserModel, useGroupMembers } from "@/lib/data/groups";
import { urlEncode } from "@/utils/func";
import { LoadError } from "../_components/group-states";

const GroupMembers = ({
  id,
  backTo,
  showAll,
}: {
  id: string;
  backTo: string;
  showAll?: boolean;
}) => {
  const { user } = useAuth();
  const { data: members, isLoading, error, refetch } = useGroupMembers(id);

  if (isLoading)
    return (
      <div className="flex flex-col my-6">
        <Skeleton className="w-[100px] h-6 rounded-md" />
        <div className="flex flex-col mt-3 gap-4">
          {[1, 2, 3].map((i) => (
            <UserCardLoading key={i} />
          ))}
        </div>
      </div>
    );

  if (error) return <LoadError error={error} onRetry={() => refetch()} />;

  const users = (members ?? []).map(toUserModel);
  const shown = showAll ? users : users.slice(0, 4);

  const loadMore = urlEncode({
    path: `/groups/${id}/settings`,
    query: { back: backTo, show: "all" },
  });

  const showLoadMore = users.length <= 3 ? false : !showAll;

  const backUrl = urlEncode({ path: `/groups/${id}/settings` });

  return users.length === 0 ? null : (
    <div>
      <div className="pt-6 pb-3 font-semibold text-normal">Group members</div>
      <div className="pb-6 flex flex-col gap-4">
        <Link href={`/groups/${id}/add-member`}>
          <ListItem title="Add members to group" icon={<UserPlus />} />
        </Link>
        {shown.map((d) => (
          <Link href={`/friends/${d.id}?back=${backUrl}`} key={d.id}>
            <UserCard showMail={false} currUserId={user?.uid ?? ""} user={d} />
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
