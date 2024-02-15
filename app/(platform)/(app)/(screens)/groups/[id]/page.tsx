import { db } from "@/lib/db";
import { GroupCard } from "@/app/(platform)/(app)/_components/group-card";
import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon, SettingsIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs";
import { ExpenseCard } from "@/app/(platform)/(app)/_components/expense-card";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import { UserAvatars } from "../../../_components/user-avatars";
import { ExpensesList } from "./expenses-list";
import { urlEncode } from "@/utils/func";

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
