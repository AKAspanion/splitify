import { Button } from "@/components/ui/button";
import { SearchIcon, UserRoundPlusIcon } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { GroupCard } from "@/app/(platform)/(app)/_components/group-card";
import { AutoContainer } from "@/components/container/auto-container";
import { auth } from "@clerk/nextjs";
import { Header } from "@/components/container/header";

const GroupsPage = async () => {
  const { userId } = auth();
  const data = await db.user.findUnique({
    where: { id: userId || "null" },
    include: { groups: true },
  });

  return (
    <AutoContainer
      header={
        <Header
          title="Groups"
          actions={
            <>
              <Button disabled variant="ghost" size="icon">
                <SearchIcon />
              </Button>
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
        {data?.groups.map((g) => {
          return <GroupCard key={g.id} group={g} />;
        })}
      </div>
    </AutoContainer>
  );
};

export default GroupsPage;
