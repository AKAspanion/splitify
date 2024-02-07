import { Button } from "@/components/ui/button";
import { SearchIcon, UserRoundPlusIcon } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { GroupCard } from "../../_components/group-card";
import { AutoContainer } from "@/components/container/auto-container";
import { auth } from "@clerk/nextjs";

const GroupsPage = async () => {
  const { userId } = auth();
  const data = await db.user.findUnique({
    where: { clerk_id: userId || "null" },
    include: { groups: true },
  });

  return (
    <AutoContainer
      header={
        <div className="flex w-full justify-between items-center">
          <div className="font-semibold text-lg">Groups</div>
          <div className="flex gap-4">
            <Button disabled variant="ghost" size="icon">
              <SearchIcon />
            </Button>
            <Link href="/groups/add">
              <Button variant="ghost" size="icon">
                <UserRoundPlusIcon />
              </Button>
            </Link>
          </div>
        </div>
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
