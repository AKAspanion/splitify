import { db } from "@/lib/db";
import { UserPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { NoData } from "@/components/no-data";

const ExpensesTabs = dynamic(() => import("./expenses-tabs"), {
  loading: () => (
    <div className="grid grid-cols-3 gap-2 py-6">
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
    </div>
  ),
});
const GroupExpenses = async ({
  id,
  userId,
  backUrl,
}: {
  id: string;
  backUrl: string;
  userId: string | null;
}) => {
  const [group, expenseCount] = await db.$transaction([
    db.group.findUnique({
      where: { id, users: { some: { id: userId || "null" } } },
      include: { users: true },
    }),
    db.expense.count({ where: { groupId: id } }),
  ]);

  const noUsers =
    !group?.users ||
    (group?.users?.length == 1 && group?.users[0].id === userId);

  const noData = !expenseCount ? !group || noUsers : false;

  return noData ? (
    <>
      {noUsers ? (
        <NoData
          title="It's so quiet here"
          subtitle="Start adding expense and/or group members"
          action={
            <Link href={`/groups/${id}/add-member?back=${backUrl}`}>
              <Button type="button" variant={"outline"}>
                <div className="flex gap-4 items-center">
                  <div>Add members</div>
                  <UserPlusIcon />
                </div>
              </Button>
            </Link>
          }
        />
      ) : null}
    </>
  ) : (
    <ExpensesTabs id={id} />
  );
};

export default GroupExpenses;
