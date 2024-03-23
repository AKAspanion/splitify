import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import Link from "next/link";

const ExpensesPaginate = async ({
  groupId,
  page,
  count,
}: {
  groupId: string;
  page: number;
  count: number;
}) => {
  const totalCount = await db.expense.count({ where: { groupId } });

  const more = totalCount > count;

  return more ? (
    <div className="flex w-full items-center justify-center">
      <Link href={`/groups/${groupId}?page=${page + 1}`}>
        <Button type="button" variant={"secondary"}>
          <div>Show more</div>
        </Button>
      </Link>
    </div>
  ) : null;
};

export default ExpensesPaginate;
