"use client";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import { UserPlusIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import ExpensesPaginate from "./expenses-paginate";
import { useGroupExpenses } from "@/lib/data/groups";
import { ExpenseCardLoader } from "./expense-card";
import { LoadError } from "./_components/group-states";

const ExpensesList = ({
  backUrl,
  groupId,
}: {
  groupId: string;
  backUrl: string;
}) => {
  const { data, isLoading, error, refetch } = useGroupExpenses(groupId, "");

  if (isLoading)
    return (
      <div className="py-6">
        <ExpenseListLoader />
      </div>
    );

  if (error) return <LoadError error={error} onRetry={() => refetch()} />;

  const noExpenses = (data?.pages[0]?.total ?? 0) === 0;

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
      ) : null}
      <ExpensesPaginate groupId={groupId} />
    </>
  );
};

export const ExpenseListLoader = () => {
  return (
    <div className="">
      <div className="pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <ExpenseCardLoader key={i} />
        ))}
      </div>
    </div>
  );
};

export default ExpensesList;
