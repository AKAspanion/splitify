import { ExpenseCard } from "./expense-card";
import { NoData } from "@/components/no-data";
import { ScrollTo } from "@/components/scroll-to";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { UserPlusIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import React from "react";

const ExpensesPaginate = dynamic(() => import("./expenses-paginate"), {
  loading: () => (
    <div className="py-6 flex w-full items-center justify-center">
      <Skeleton className="h-10 w-[108px]" />
    </div>
  ),
});

const PAGE_COUNT = 10;

const ExpensesList = async ({
  page,
  backUrl,
  groupId,
}: {
  page: number;
  groupId: string;
  backUrl: string;
}) => {
  const take = page * PAGE_COUNT;
  const expenses = await db.expense.findMany({
    take,
    where: { groupId },
    orderBy: [{ createdAt: "desc" }],
  });

  const count = expenses ? expenses?.length : 0;

  const noExpenses = count === 0;

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
            {expenses?.map((e, i) => (
              <React.Fragment key={e.id}>
                <ExpenseCard expense={e} key={e.id} />
                {(i + 1) % PAGE_COUNT === 0 && i !== count - 1 ? (
                  <hr id={`take${i + 1}`} />
                ) : null}
              </React.Fragment>
            ))}
          </div>
          <ExpensesPaginate groupId={groupId} page={page} count={count} />
          <ScrollTo id={`take${take - PAGE_COUNT}`} parent={"expenseslist"} />
        </>
      )}
    </>
  );
};

export const ExpenseListLoader = () => {
  return (
    <div className="py-6">
      <div className="pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="rounded-full w-10 h-10" />
            <div>
              <Skeleton className="h-4 mt-0.5 w-[90px]" />
              <Skeleton className="h-3 mt-1 w-[120px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpensesList;
