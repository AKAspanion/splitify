"use client";

import { Button } from "@/components/ui/button";
import { SearchIcon, UserRoundPlusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { urlEncode } from "@/utils/func";
import { Search } from "@/app/(platform)/(app)/_components/search";
import { MY_GROUPS_LIMIT, useMyGroups } from "@/lib/data/groups";
import GroupCreate from "./group-create";
import Groups from "./groups";

// Groups listed until "Show all".
const GROUPS_PREVIEW = 6;

const GroupList = () => {
  const params = useSearchParams();
  const searchParams = Object.fromEntries(params.entries());
  const show = searchParams["show"] === "all";
  const search = searchParams["search"] === "yes";
  const searchText = searchParams["text"] ?? "";

  const { data, isLoading, error, refetch } = useMyGroups(
    searchText,
    MY_GROUPS_LIMIT,
  );
  const groups = show ? data : data?.slice(0, GROUPS_PREVIEW);

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
                      aria-label="Close search"
                    >
                      <XIcon />
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href={searchUrl}>
                  <Button variant="ghost" size="icon" aria-label="Search">
                    <SearchIcon />
                  </Button>
                </Link>
              )}

              <Link href="/groups/add">
                <Button variant="ghost" size="icon" aria-label="Create a group">
                  <UserRoundPlusIcon />
                </Button>
              </Link>
            </>
          }
        />
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Groups
          groups={groups}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
        />
      </div>
      {isLoading || error ? null : (
        <GroupCreate
          count={data?.length ?? 0}
          show={show}
          searchText={searchText}
        />
      )}
      <div className="h-[72px]" />
    </AutoContainer>
  );
};

export default GroupList;
