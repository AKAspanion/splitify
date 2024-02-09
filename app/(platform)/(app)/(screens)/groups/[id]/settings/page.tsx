import { db } from "@/lib/db";
import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  SettingsIcon,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs";
import { GroupCard } from "@/app/(platform)/(app)/_components/group-card";
import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { ListItem } from "@/components/list-item";

const GroupDetailsPage = async ({ params }: ServerSideComponentProp) => {
  const id = params["id"] || "null";
  const { userId } = auth();

  const group = await db.group.findUnique({
    where: { id, users: { some: { id: userId || "null" } } },
    include: { users: true },
  });

  return (
    <AutoContainer
      header={
        <div className="flex w-full gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <Link href={`/groups/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeftIcon />
              </Button>
            </Link>
            <div className="font-semibold text-lg">Group Settings</div>
          </div>
        </div>
      }
    >
      <GroupCard group={group} />
      <div className="pt-6 pb-3 font-semibold text-normal">Group members</div>
      <div className="pb-6 flex flex-col gap-6">
        <Link href={`/groups/${id}/add-member`}>
          <ListItem title="Add members to group" icon={<UserPlus />} />
        </Link>
        {group?.users?.map((d) => (
          <UserCard user={d} key={d.id} />
        ))}
      </div>
    </AutoContainer>
  );
};

export default GroupDetailsPage;
