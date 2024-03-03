import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import Link from "next/link";

const ActivityPaginate = async ({
  page,
  count,
  groups,
}: {
  page: number;
  count: number;
  groups: {
    id: string;
  }[];
}) => {
  const { userId } = auth();
  const where = {
    OR: [
      { groupId: { in: groups.map((u) => u.id) } },
      { users: { some: { id: userId || "null" } } },
    ],
  };
  const totalCount = await db.activity.count({ where });

  const more = totalCount > count;

  return more ? (
    <div className="flex w-full items-center justify-center">
      <Link href={`/activity?page=${page + 1}`}>
        <Button type="button" variant={"secondary"}>
          <div>Show more</div>
        </Button>
      </Link>
    </div>
  ) : null;
};

export default ActivityPaginate;
