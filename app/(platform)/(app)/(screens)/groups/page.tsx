import { Button } from "@/components/ui/button";
import { SearchIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { GroupCard } from "../../_components/group-card";
import { AutoContainer } from "@/components/container/auto-container";

const GroupsPage = async () => {
  const groups = await db.group.findMany();
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
                <UserPlusIcon />
              </Button>
            </Link>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((g) => {
          return <GroupCard key={g.id} group={g} />;
        })}
      </div>
    </AutoContainer>
  );
};

export default GroupsPage;
