"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  UserCard,
  UserCardLoading,
} from "@/app/(platform)/(app)/_components/user-card";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import { FRIENDS_PAGE_COUNT } from "@/constants/numbers";
import { toUserMessage } from "@/lib/data/errors";
import { toCardUser, useFriends } from "@/lib/data/people";
import FriendsPaginate from "./friends-paginate";

const FriendsList = () => {
  const searchParams = useSearchParams();
  const pageNo = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isNaN(pageNo) || pageNo < 1 ? 1 : pageNo;

  const { data: friends, isPending, error, refetch } = useFriends();

  const total = friends?.length ?? 0;
  const shown = friends?.slice(0, page * FRIENDS_PAGE_COUNT) ?? [];

  return (
    <AutoContainer
      header={
        <Header
          title="Friends"
          actions={
            <Link href="/friends/add" aria-label="Add a friend">
              <Button variant="ghost" size="icon">
                <UserPlusIcon />
              </Button>
            </Link>
          }
        />
      }
    >
      {isPending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <UserCardLoading key={i} />
          ))}
        </div>
      ) : error ? (
        <NoData
          title={toUserMessage(error)}
          action={
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      ) : total === 0 ? (
        <NoData
          title="Your friends and group mates will show up here"
          action={<CreateButton />}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map((d) => (
              <Link href={`/friends/${d.id}`} key={d.id}>
                <UserCard user={toCardUser(d)} />
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-6 py-6">
            <FriendsPaginate count={shown.length} total={total} page={page} />
            <div className="flex justify-center">
              <CreateButton />
            </div>
          </div>
        </>
      )}
      <div className="h-16" />
    </AutoContainer>
  );
};

const CreateButton = () => {
  return (
    <Link href="/friends/add">
      <Button type="button" variant={"outline"}>
        <div className="flex gap-4 items-center">
          <div>Add a friend</div>
          <UserPlusIcon />
        </div>
      </Button>
    </Link>
  );
};

export default FriendsList;
