import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import Link from "next/link";

const FriendsPaginate = async ({
  page,
  count,
}: {
  page: number;
  count: number;
}) => {
  const { userId } = auth();

  const totalCount = await db.user.count({
    where: { friends: { some: { id: userId || "null" } } },
  });

  const more = totalCount > count;

  return more ? (
    <div className="flex w-full items-center justify-center">
      <Link href={`/friends?page=${page + 1}`}>
        <Button type="button" variant={"secondary"}>
          <div>Show more</div>
        </Button>
      </Link>
    </div>
  ) : null;
};

export default FriendsPaginate;
