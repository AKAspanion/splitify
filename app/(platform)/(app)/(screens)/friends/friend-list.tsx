import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";

const FriendsPage = async () => {
  const { userId } = auth();
  const data = await db.user.findUnique({
    where: { id: userId || "null" },
    select: { friends: true },
  });

  const noData = !data?.friends || data?.friends?.length === 0;

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
        {data?.friends?.map((d) => <UserCard user={d} key={d.id} />)}
      </div>
      {noData ? (
        <NoData
          title="Your friends and group mates will show up here"
          action={<CreateButton />}
        />
      ) : (
        <div className="flex justify-center py-8">
          <CreateButton />
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

export default FriendsPage;
