import { db } from "@/lib/db";
import { UserPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { NoData } from "@/components/no-data";

const ExpensesTabs = dynamic(() => import("./expenses-tabs"), {
  loading: () => (
    <div className="grid grid-cols-3 gap-2 pb-6">
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
    </div>
  ),
});
const GroupExpenses = async ({
  id,
  groupId,
  backUrl,
}: {
  id: string;
  backUrl: string;
  groupId?: string | null;
}) => {
  const [userCount, expenseCount] = await db.$transaction([
    db.user.count({
      where: { groups: { some: { id: groupId || "null" } } },
    }),
    db.expense.count({ where: { groupId: id } }),
  ]);

  const noUsers = userCount <= 1;
  const noExpenses = expenseCount === 0;

  const noData = noExpenses;

  const noDataSubtitle =
    noExpenses && !noUsers
      ? "Start adding expenses to get started"
      : "Start adding expenses and/or group members";

  return noData ? (
    <>
      {noExpenses ? (
        <NoData
          title="It's so quiet here"
          subtitle={noDataSubtitle}
          action={
            noUsers ? (
              <Link href={`/groups/${id}/add-member?back=${backUrl}`}>
                <Button type="button" variant={"outline"}>
                  <div className="flex gap-4 items-center">
                    <div>Add members</div>
                    <UserPlusIcon />
                  </div>
                </Button>
              </Link>
            ) : null
          }
        />
      ) : null}
    </>
  ) : (
    <ExpensesTabs id={id} />
  );
};

export default GroupExpenses;
