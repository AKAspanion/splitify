import { db } from "@/lib/db";
import { UserAvatars } from "@/app/(platform)/(app)/_components/user-avatars";
import { PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const GroupUsers = async ({ id, backUrl }: { id: string; backUrl: string }) => {
  const users = await db.user.findMany({
    where: { groups: { some: { id: id || "null" } } },
  });

  const noData = !users || users.length === 0;

  return noData ? null : (
    <UserAvatars
      users={users}
      action={
        <div className="h-10 flex items-center justify-center">
          <Link href={`/groups/${id}/add-member?back=${backUrl}`}>
            <Button variant="ghost" size="icon">
              <PlusCircleIcon className="text-sparkle" />
            </Button>
          </Link>
        </div>
      }
    />
  );
};

export default GroupUsers;
