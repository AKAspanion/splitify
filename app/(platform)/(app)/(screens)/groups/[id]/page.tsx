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

const GroupDetailsPage = async ({ params }: ServerSideComponentProp) => {
  const id = params["id"] || "null";
  const { userId } = auth();

  const group = await db.group.findUnique({
    where: { id, users: { some: { id: userId || "null" } } },
    include: { users: true },
  });

  const expenses = await db.expense.findMany({
    where: { groupId: id },
    include: { splits: true, payments: { include: { user: true } } },
  });

  const noUsers =
    !group?.users ||
    (group?.users?.length == 1 && group?.users[0].id === userId);

  const noExpenses = !expenses || expenses?.length == 0;

  const noData = !group || noUsers || noExpenses;

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
                <Link href={`/groups/${id}/add-member?back=/groups/${id}`}>
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
                <Link href={`/groups/${group.id}/add-member?back=/groups/${group.id}`}>
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
          {noExpenses && !noUsers ? (
            <NoData
              title="No expenses here yet."
              subtitle="Go ahead and add some expenses."
            />
          ) : null}
        </>
      ) : (
        <>
          <div className="pt-6 pb-3 font-semibold text-normal">
            Group expenses
          </div>
          <div className="pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenses?.map((e) => <ExpenseCard expense={e} key={e.id} />)}
          </div>
        </>
      )}
    </AutoContainer>
  );
};

export default GroupDetailsPage;
