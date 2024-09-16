import { Button } from "@/components/ui/button";
import { SearchIcon, UserRoundPlusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { AutoContainer } from "@/components/container/auto-container";
import { auth } from "@clerk/nextjs";
import { Header } from "@/components/container/header";
import { urlEncode } from "@/utils/func";
import { Search } from "@/app/(platform)/(app)/_components/search";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const GroupCreate = dynamic(() => import("./group-create"), {
  loading: () => (
    <div className="w-full flex justify-center py-6">
      <Skeleton className="w-[100px] h-10" />
    </div>
  ),
});

const Groups = dynamic(() => import("./groups"));

const GroupList = async ({ searchParams }: ServerSideComponentProp) => {
  const show = searchParams["show"] === "all";
  const search = searchParams["search"] === "yes";
  const searchText = searchParams["text"];

  const { userId } = auth();

  const query = {
    take: show ? undefined : 6,
    where: {
      users: { some: { id: userId || "null" } },
      title: { contains: searchText },
    },
  };

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
        <Groups show={show} searchText={searchText} />
      </div>
      <GroupCreate where={query.where} show={show} searchText={searchText} />
      <div className="h-[72px]" />
    </AutoContainer>
  );
};

export default GroupList;
