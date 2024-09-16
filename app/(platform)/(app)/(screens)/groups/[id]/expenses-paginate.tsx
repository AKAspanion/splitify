"use client";

import { useInView } from "react-intersection-observer";
import { ExpenseCard, ExpenseCardLoader } from "./expense-card";
import useExpenses from "@/hooks/use-expenses";
import { cn } from "@/lib/utils";
import { EXPENSE_PAGE_COUNT } from "@/constants/numbers";
import React, { useEffect } from "react";

const ExpensesPaginate = ({ groupId }: { groupId: string }) => {
  const { data, isLoading, isFetching, isFetchingNextPage, loadMore } =
    useExpenses(groupId);

  const { ref, inView } = useInView();

  const pages = data?.pages || [];

  const loading = isLoading || isFetching || isFetchingNextPage;

  useEffect(() => {
    if (inView && !loading) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <div className="pb-8 pt-6">
      <div
        className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6")}
      >
        {pages.map(({ expenses }, i) => (
          <React.Fragment key={i}>
            {expenses?.map((e, i) => (
              <div key={e.id}>
                <ExpenseCard expense={e} key={e.id} />
              </div>
            ))}
          </React.Fragment>
        ))}
        {loading
          ? Array.from(Array(EXPENSE_PAGE_COUNT).keys()).map((i) => (
              <ExpenseCardLoader key={i} />
            ))
          : null}
      </div>
      <div ref={loading ? null : ref} className={cn("w-full")} />
    </div>
  );
};

export default ExpensesPaginate;
