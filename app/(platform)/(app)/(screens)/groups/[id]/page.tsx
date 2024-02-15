import { db } from "@/lib/db";
import { GroupCard } from "@/app/(platform)/(app)/_components/group-card";
import { AutoContainer } from "@/components/container/auto-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon, SettingsIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import { urlEncode } from "@/utils/func";
import dynamic from "next/dynamic";
import { UserAvatars } from "@/app/(platform)/(app)/_components/user-avatars";

const ExpensesList = dynamic(() => import("./expenses-list"), {
  loading: () => (
    <div>
      <Skeleton className="h-6 mt-6 mb-3 w-[90px]" />
      <div className="pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="rounded-full w-10 h-10" />
            <div>
              <Skeleton className="h-4 mt-0.5 w-[90px]" />
              <Skeleton className="h-3 mt-1 w-[120px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
});

const GroupDetailsPage = async ({
  params,
  searchParams,
}: ServerSideComponentProp) => {
  const id = params["id"] || "null";
  const { userId } = auth();

  const group = await db.group.findUnique({
    where: { id, users: { some: { id: userId || "null" } } },
    include: { users: true },
  });

  const noUsers =
    !group?.users ||
    (group?.users?.length == 1 && group?.users[0].id === userId);

  const noData = !group || noUsers;

  const backUrl = urlEncode({
    path: `/groups/${id}`,
    query: searchParams,
  });

  return (
    <AutoContainer
      header={
        <Header
          backTo="/groups"
          title={group?.title}
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
        <GroupCard group={group} />

        {noUsers ? null : (
          <UserAvatars
            users={group?.users}
            action={
              <div className="h-10 flex items-center justify-center">
                <Link href={`/groups/${id}/add-member?back=${backUrl}`}>
                  <Button variant="ghost" size="icon">
                    <PlusCircleIcon />
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
        <ExpensesList id={id} />
      )}
    </AutoContainer>
  );
};

export default GroupDetailsPage;
