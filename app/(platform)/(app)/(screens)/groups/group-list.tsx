import { Button } from "@/components/ui/button";
import { SearchIcon, UserRoundPlusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { GroupCard } from "@/app/(platform)/(app)/_components/group-card";
import { AutoContainer } from "@/components/container/auto-container";
import { auth } from "@clerk/nextjs";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import dynamic from "next/dynamic";
import { BalancesLoader } from "./[id]/balances-loader";
import { urlEncode } from "@/utils/func";
import { Search } from "../../_components/search";

const Balances = dynamic(() => import("./[id]/balances"), {
  loading: () => <BalancesLoader dense onlyList />,
});

const GroupList = async ({ searchParams }: ServerSideComponentProp) => {
  const show = searchParams["show"] === "all";
  const search = searchParams["search"] === "yes";
  const searchText = searchParams["text"];

  const { userId } = auth();

  const query = {
    take: show ? undefined : 5,
    where: {
      users: { some: { id: userId || "null" } },
      title: { contains: searchText },
    },
  };

  const [groups, count] = await db.$transaction([
    db.group.findMany({
      ...query,
      orderBy: [{ createdAt: "desc" }],
    }),
    db.group.count({ where: query.where }),
  ]);

  const noData = count === 0;

  const showAll = !show && count > 5;

  const searchUrl = urlEncode({
    path: "/groups",
    query: { ...searchParams, search: "yes" },
  });

  const searchUrlClose = urlEncode({
    path: "/groups",
    query: { ...searchParams, search: "", text: "" },
  });

  const noDataTitle = searchText
    ? "No results found"
    : "Groups you create or are added to will show up here";

  return (
    <AutoContainer
      header={
        <Header
          title={"Groups"}
          actions={
            <>
              {search ? (
                <>
                  <Search
                    searchParams={searchParams}
                    queryText={searchText}
                    path={"/groups"}
                  />
                  <Link href={searchUrlClose}>
                    <Button
                      className="text-red-500"
                      variant="ghost"
                      size="icon"
                    >
                      <XIcon />
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href={searchUrl}>
                  <Button variant="ghost" size="icon">
                    <SearchIcon />
                  </Button>
                </Link>
              )}

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
              action={
                <div className={"pt-1 text-xs font-light"}>
                  {search ? null : <Balances id={g.id} onlyList />}
                </div>
              }
            />
          );
        })}
      </div>

      {noData ? (
        <NoData title={noDataTitle} action={<CreateButton />} />
      ) : (
        <div className="w-full flex flex-col gap-6 items-center py-8">
          {showAll ? (
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
