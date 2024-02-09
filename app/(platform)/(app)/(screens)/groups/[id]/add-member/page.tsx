import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Action } from "./action";

const Addmember = async ({ params }: ServerSideComponentProp) => {
  const id = params["id"] || "null";
  const { userId } = auth();
  const data = await db.user.findUnique({
    where: { id: userId || "null" },
    include: { friends: true },
  });

  const group = await db.group.findUnique({
    where: { id, users: { some: { id: userId || "null" } } },
    include: { users: true },
  });

  return (
    <AutoContainer
      header={
        <div className="flex w-full justify-between items-center">
          <div className="flex gap-4 items-center">
            <Link href={`/groups/${id}/settings`}>
              <Button variant="ghost" size="icon">
                <ArrowLeftIcon />
              </Button>
            </Link>
            <div className="font-semibold text-lg">Add members to group</div>
          </div>
        </div>
      }
    >
      <div className="pb-6 flex flex-col gap-6">
        {data?.friends?.map((d) => (
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
      </div>
    </AutoContainer>
  );
};

export default Addmember;
