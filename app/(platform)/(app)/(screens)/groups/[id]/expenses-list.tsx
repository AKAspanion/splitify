import { getExpenses } from "@/actions/get-expense";
import { ExpenseCard } from "./expense-card";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlusIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import ExpensesPaginate from "./expenses-paginate";

const ExpensesList = async ({
  backUrl,
  groupId,
}: {
  groupId: string;
  backUrl: string;
}) => {
  const { data: expenses } = await getExpenses(1, groupId);

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
        <ExpensesPaginate groupId={groupId} intialExpenses={expenses} />
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
