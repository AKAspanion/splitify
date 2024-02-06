import { Button } from "@/components/ui/button";
import { SearchIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

const GroupsPage = async () => {
  const groups = await db.group.findMany();
  return (
    <div className="p-6 px-8">
      <div className="flex justify-between items-center">
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
      <div className="py-6">
        <div>
          {groups.map((g) => {
            return <div key={g.id}>{g.title}</div>;
          })}
        </div>
      </div>
    </div>
  );
};

export default GroupsPage;
