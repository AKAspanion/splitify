import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { Header } from "@/components/container/header";

const FriendsPage = async () => {
  const { userId } = auth();
  const data = await db.user.findUnique({
    where: { id: userId || "null" },
    include: { friends: true },
  });

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
      <div className="pb-6 flex flex-col gap-6">
        {data?.friends?.map((d) => <UserCard user={d} key={d.id} />)}
      </div>
    </AutoContainer>
  );
};

export default FriendsPage;
