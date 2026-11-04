"use client";

import { useInView } from "react-intersection-observer";
import { ExpenseCard, ExpenseCardLoader } from "./expense-card";
import { EXPENSES_PAGE_SIZE, useGroupExpenses } from "@/lib/data/groups";
import { cn } from "@/lib/utils";
import React, { useEffect } from "react";

const ExpensesPaginate = ({ groupId }: { groupId: string }) => {
  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useGroupExpenses(groupId, "");

  const { ref, inView } = useInView();

  const pages = data?.pages || [];

  const loading = isFetching || isFetchingNextPage;

  useEffect(() => {
    if (inView && !loading && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, loading, hasNextPage, fetchNextPage]);

  return (
    <div className="pb-8 pt-6">
      <div
        className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6")}
      >
        {pages.map(({ expenses }, i) => (
          <React.Fragment key={i}>
            {expenses.map((e) => (
              <div key={e.id}>
                <ExpenseCard expense={e} groupId={groupId} />
              </div>
            ))}
          </React.Fragment>
        ))}
        {isFetchingNextPage
          ? Array.from(Array(EXPENSES_PAGE_SIZE).keys()).map((i) => (
              <ExpenseCardLoader key={i} />
            ))
          : null}
      </div>
      <div ref={loading ? null : ref} className={cn("w-full")} />
    </div>
  );
};

export default ExpensesPaginate;
