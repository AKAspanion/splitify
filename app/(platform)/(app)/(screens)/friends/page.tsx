import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { UserCard } from "../../_components/user-card";

const FriendsPage = async () => {
  const { userId } = auth();
  const [data] = await db.user.findMany({
    where: { clerk_id: userId || "null" },
    include: { friends: true },
  });

  return (
    <AutoContainer
      header={
        <div className="flex w-full justify-between items-center">
          <div className="font-semibold text-lg">Friends</div>
          <div className="flex gap-4">
            <Link href="/friends/add">
              <Button variant="ghost" size="icon">
                <UserPlusIcon />
              </Button>
            </Link>
          </div>
        </div>
      }
    >
      <div className="pb-6 flex flex-col gap-6">
        {data?.friends?.map((d) => (
          <UserCard user={d} key={d.id} />
        ))}
      </div>
    </AutoContainer>
  );
};

export default FriendsPage;
