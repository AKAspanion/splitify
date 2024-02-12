import { db } from "@/lib/db";
import { AutoContainer } from "@/components/container/auto-container";
import { TrashIcon, UserPlus } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs";
import { GroupCard } from "@/app/(platform)/(app)/_components/group-card";
import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { ListItem } from "@/components/list-item";
import { Header } from "@/components/container/header";

const GroupDetailsPage = async ({
  params,
  searchParams,
}: ServerSideComponentProp) => {
  const id = params["id"] || "null";
  const backTo = searchParams["back"];
  const { userId } = auth();

  const group = await db.group.findUnique({
    where: { id, users: { some: { id: userId || "null" } } },
    include: { users: true },
  });

  return (
    <AutoContainer
      header={
        <Header
          backTo={backTo ? backTo : `/groups/${id}`}
          title="Group Settings"
        />
      }
    >
      <GroupCard group={group} description={group?.type || ""} />
      <div className="pt-6 pb-3 font-semibold text-normal">Group members</div>
      <div className="pb-6 flex flex-col gap-6">
        <Link href={`/groups/${id}/add-member`}>
          <ListItem title="Add members to group" icon={<UserPlus />} />
        </Link>
        {group?.users?.map((d) => (
          <UserCard
            showMail={false}
            currUserId={userId || ""}
            user={d}
            key={d.id}
          />
        ))}
        <hr />

        <div className="text-red-500 cursor-pointer">
          <ListItem title="Delete group" icon={<TrashIcon width={20} />} />
        </div>
      </div>
    </AutoContainer>
  );
};

export default GroupDetailsPage;
