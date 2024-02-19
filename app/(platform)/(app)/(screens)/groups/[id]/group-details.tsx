import { db } from "@/lib/db";
import { GroupCard } from "@/app/(platform)/(app)/_components/group-card";
import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon, SettingsIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import dynamic from "next/dynamic";
import { UISpinner } from "@/components/ui-spinner";
import { Badge } from "@/components/ui/badge";
import { UserAvatars } from "@/app/(platform)/(app)/_components/user-avatars";

const ExpensesTabs = dynamic(() => import("./expenses-tabs"), {
  loading: () => (
    <div className="grid grid-cols-3 gap-2 py-6">
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
    </div>
  ),
});

const GroupDetails = async ({
  id,
  backUrl,
}: {
  id: string;
  backUrl: string;
}) => {
  const { userId } = auth();

  const group = await db.group.findUnique({
    where: { id, users: { some: { id: userId || "null" } } },
    include: { users: true },
  });

  const noUsers =
    !group?.users ||
    (group?.users?.length == 1 && group?.users[0].id === userId);

  const noData = !group || noUsers;

  return (
    <AutoContainer
      header={
        <Header
          backTo="/groups"
          title={""}
          actions={
            <Link href={`/groups/${id}/settings`}>
              <Button variant="ghost" size="icon">
                <SettingsIcon />
              </Button>
            </Link>
          }
        />
      }
    >
      <div className="flex flex-col gap-6">
        <GroupCard
          group={group}
          description={
            <div className="pt-0.5">
              {group?.type ? <Badge size="sm">{group?.type}</Badge> : null}
            </div>
          }
        />

        {noUsers ? null : (
          <UserAvatars
            users={group?.users}
            action={
              <div className="h-10 flex items-center justify-center">
                <Link href={`/groups/${id}/add-member?back=${backUrl}`}>
                  <Button variant="ghost" size="icon">
                    <PlusCircleIcon className="text-sparkle" />
                  </Button>
                </Link>
              </div>
            }
          />
        )}
      </div>
      {noData ? (
        <>
          {group && noUsers ? (
            <NoData
              title="You are alone here"
              action={
                <Link href={`/groups/${group.id}/add-member?back=${backUrl}`}>
                  <Button type="button" variant={"outline"}>
                    <div className="flex gap-4 items-center">
                      <div>Add members</div>
                      <UserPlusIcon />
                    </div>
                  </Button>
                </Link>
              }
            />
          ) : null}
        </>
      ) : (
        <ExpensesTabs id={id} />
      )}
    </AutoContainer>
  );
};

export default GroupDetails;