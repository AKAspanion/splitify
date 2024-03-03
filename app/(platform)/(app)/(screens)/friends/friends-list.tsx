import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const FriendsPaginate = dynamic(() => import("./friends-paginate"), {
  loading: () => (
    <div className="py-6 flex w-full items-center justify-center">
      <Skeleton className="h-10 w-[108px]" />
    </div>
  ),
});

const PAGE_COUNT = 10;

const FriendsList = async ({ searchParams }: ServerSideComponentProp) => {
  const pageNo = searchParams["page"] || "1";
  const { userId } = auth();

  const page = isNaN(pageNo) ? 1 : parseInt(pageNo);

  const friends = await db.user.findMany({
    take: page * PAGE_COUNT,
    where: { friends: { some: { id: userId || "null" } } },
  });

  const count = friends ? friends?.length : 0;

  const noData = count === 0;

  return (
    <AutoContainer
      header={
        <Header
          title="Friends"
          actions={
            <Link href="/friends/add">
              <Button variant="ghost" size="icon">
                <UserPlusIcon />
              </Button>
            </Link>
          }
        />
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {friends?.map((d) => <UserCard user={d} key={d.id} />)}
      </div>
      {noData ? (
        <NoData
          title="Your friends and group mates will show up here"
          action={<CreateButton />}
        />
      ) : (
        <div className="flex flex-col gap-6 py-6">
          <FriendsPaginate count={count} page={page} />
          <div className="flex justify-center">
            <CreateButton />
          </div>
        </div>
      )}
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
