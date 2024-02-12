import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { AutoContainer } from "@/components/container/auto-container";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { CheckIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { Action } from "./action";
import { Header } from "@/components/container/header";
import { ListItem } from "@/components/list-item";

const Addmember = async ({ params, searchParams }: ServerSideComponentProp) => {
  const id = params["id"] || "null";
  const backTo = searchParams["back"];
  const { userId } = auth();
  const data = await db.user.findUnique({
    where: { id: userId || "null" },
    include: { friends: true },
  });

  const group = await db.group.findUnique({
    where: { id, users: { some: { id: userId || "null" } } },
    include: { users: true },
  });

  const friendsNotInGroup = data?.friends?.filter(
    (o) => !group?.users?.some(({ id }) => o.id === id)
  );

  const friendsInGroup = data?.friends?.filter((o) =>
    group?.users?.some(({ id }) => o.id === id)
  );

  const noFriendsInGroup = !friendsInGroup || friendsInGroup?.length == 0;

  return (
    <AutoContainer
      header={
        <Header
          backTo={backTo ? backTo : `/groups/${id}/settings`}
          title="Add members to group"
        />
      }
    >
      <div className="pb-6 flex flex-col gap-6">
        <Link href={`/friends/add?back=/groups/${id}/add-member`}>
          <ListItem title="Add a friend" icon={<UserPlusIcon />} />
        </Link>
        {friendsNotInGroup?.map((d) => (
          <UserCard
            user={d}
            key={d.id}
            actions={
              <Action
                groupId={id}
                memberClerkId={d.id}
                isInGroup={!!group?.users?.find((u) => u.id === d.id)}
              />
            }
          />
        ))}
        <div>
          {noFriendsInGroup ? null : (
            <div className="pb-3 font-semibold text-normal">
              Already in group
            </div>
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

export default Addmember;
