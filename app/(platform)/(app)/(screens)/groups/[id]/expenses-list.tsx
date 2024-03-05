import { ExpenseCard } from "./expense-card";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { UserPlusIcon } from "lucide-react";
import Link from "next/link";

const ExpensesList = async ({
  backUrl,
  groupId,
}: {
  groupId: string;
  backUrl: string;
}) => {
  const expenses = await db.expense.findMany({
    where: { groupId },
    orderBy: [{ createdAt: "desc" }],
  });

  const noExpenses = !expenses || expenses?.length == 0;
  const noDataSubtitle = "Start adding expenses and/or group members";

  return (
    <>
      {noExpenses ? (
        <NoData
          title="It's so quiet here"
          subtitle={noDataSubtitle}
          action={
            <Link href={`/groups/${groupId}/add-member?back=${backUrl}`}>
              <Button type="button" variant={"outline"}>
                <div className="flex gap-4 items-center">
                  <div>Add members</div>
                  <UserPlusIcon />
                </div>
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="pb-8 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenses?.map((e) => <ExpenseCard expense={e} key={e.id} />)}
          </div>
        </>
      )}
    </>
  );
};

export default ExpensesList;
