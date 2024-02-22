import { Button } from "@/components/ui/button";
import { SearchIcon, UserRoundPlusIcon } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { GroupCard } from "@/app/(platform)/(app)/_components/group-card";
import { AutoContainer } from "@/components/container/auto-container";
import { auth } from "@clerk/nextjs";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import dynamic from "next/dynamic";
import { BalancesLoader } from "./[id]/balances-loader";

const Balances = dynamic(() => import("./[id]/balances"), {
  loading: () => <BalancesLoader dense onlyList />,
});

const GroupList = async ({ searchParams }: ServerSideComponentProp) => {
  const showAll = searchParams["show"] === "all";
  const { userId } = auth();

  const query = {
    take: showAll ? undefined : 5,
    where: { users: { some: { id: userId || "null" } } },
  };
  const [groups, count] = await db.$transaction([
    db.group.findMany({
      ...query,
      orderBy: [{ createdAt: "desc" }],
    }),
    db.group.count({ where: query.where }),
  ]);

  const noData = count === 0;

  return (
    <AutoContainer
      header={
        <Header
          title="Groups"
          actions={
            <>
              {/* <Button disabled variant="ghost" size="icon">
                <SearchIcon />
              </Button> */}
              <Link href="/groups/add">
                <Button variant="ghost" size="icon">
                  <UserRoundPlusIcon />
                </Button>
              </Link>
            </>
          }
        />
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups?.map((g) => {
          return (
            <GroupCard
              key={g.id}
              group={g}
              description={
                <div className={"pt-1"}>
                  <Balances id={g.id} onlyList />
                </div>
              }
            />
          );
        })}
      </div>

      {noData ? (
        <NoData
          title="Groups you create or are added to will show up here"
          action={<CreateButton />}
        />
      ) : (
        <div className="w-full flex flex-col gap-6 items-center py-8">
          {!showAll ? (
            <Link href="/groups?show=all">
              <Button type="button" variant={"secondary"}>
                <div>Show all {count} groups</div>
              </Button>
            </Link>
          ) : (
            <CreateButton />
          )}
        </div>
      )}
      <div className="h-[72px]" />
    </AutoContainer>
  );
};

const CreateButton = () => {
  return (
    <Link href="/groups/add">
      <Button type="button" variant={"outline"}>
        <div className="flex gap-4 items-center">
          <div>Create a group</div>
          <UserRoundPlusIcon />
        </div>
      </Button>
    </Link>
  );
};

export default GroupList;
