import { Button } from "@/components/ui/button";
import { SearchIcon, UserRoundPlusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { GroupCard } from "@/app/(platform)/(app)/_components/group-card";
import { AutoContainer } from "@/components/container/auto-container";
import { auth } from "@clerk/nextjs";
import { Header } from "@/components/container/header";
import { urlEncode } from "@/utils/func";
import { Search } from "../../_components/search";
import { UISpinner } from "@/components/ui-spinner";
import dynamic from "next/dynamic";

const GroupCreate = dynamic(() => import("./group-create"), {
  loading: () => <UISpinner />,
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

  const groups = await db.group.findMany({
    ...query,
    orderBy: [{ createdAt: "desc" }],
  });

  const searchUrl = urlEncode({
    path: "/groups",
    query: { ...searchParams, search: "yes" },
  });

  const searchUrlClose = urlEncode({
    path: "/groups",
    query: { ...searchParams, search: "", text: "" },
  });

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
          return <GroupCard key={g.id} group={g} />;
        })}
      </div>
      <GroupCreate where={query.where} show={show} searchText={searchText} />
      <div className="h-[72px]" />
    </AutoContainer>
  );
};

export default GroupList;
