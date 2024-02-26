import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { AutoContainer } from "@/components/container/auto-container";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { CheckIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { Action } from "./action";
import { Header } from "@/components/container/header";
import { ListItem } from "@/components/list-item";
import { urlEncode } from "@/utils/func";

const AddMember = async ({ params, searchParams }: ServerSideComponentProp) => {
  const id = params["id"] || "null";
  const backTo = searchParams["back"];
  const { userId } = auth();

  const [user, group] = await db.$transaction([
    db.user.findUnique({
      where: { id: userId || "null" },
      select: { friends: true },
    }),
    db.group.findUnique({
      where: { id, users: { some: { id: userId || "null" } } },
      include: { users: true },
    }),
  ]);

  const friendsNotInGroup = user?.friends?.filter(
    (o) => !group?.users?.some(({ id }) => o.id === id),
  );

  const friendsInGroup = user?.friends?.filter((o) =>
    group?.users?.some(({ id }) => o.id === id),
  );

  const noFriendsInGroup = !friendsInGroup || friendsInGroup?.length == 0;

  const backUrl = urlEncode({
    path: `/groups/${id}/add-member`,
    query: searchParams,
  });

  const addFriendUrl = urlEncode({
    path: `/friends/add`,
    query: { groupId: id, back: backUrl },
  });

  const backToUrl = urlEncode({
    path: backTo ? backTo : `/groups/${id}/settings`,
  });

  return (
    <AutoContainer
      header={<Header backTo={backToUrl} title="Add members to group" />}
    >
      <div className="pb-6 flex flex-col gap-6">
        <Link href={addFriendUrl}>
          <ListItem title="Add a friend" icon={<UserPlusIcon />} />
        </Link>
        {friendsNotInGroup?.map((d) => (
          <UserCard
            user={d}
            key={d.id}
            actions={
              <Action
                groupId={id || group?.id}
                memberClerkId={d.id}
                isInGroup={!!group?.users?.find((u) => u.id === d.id)}
              />
            }
          />
        ))}
        <div>
          {noFriendsInGroup ? null : (
            <div className="pb-3 font-semibold text-normal">Added in group</div>
          )}
          <div className="flex flex-col gap-6">
            {friendsInGroup?.map((d) => (
              <UserCard
                user={d}
                key={d.id}
                disabled
                actions={
                  <div className="p-2">
                    <CheckIcon className="text-green-500" />
                  </div>
                }
              />
            ))}
          </div>
        </div>
      </div>
    </AutoContainer>
  );
};

export default AddMember;
