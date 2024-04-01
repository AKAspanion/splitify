"use client";

import { useCallback, useEffect } from "react";

import { useInView } from "react-intersection-observer";
import { ExpenseCard, ExpenseCardLoader } from "./expense-card";
import { ExpenseListLoader } from "./expenses-list";
import useExpenses from "@/hooks/use-expenses";
import { cn } from "@/lib/utils";
import { EXPENSE_PAGE_COUNT } from "@/constants/numbers";

const ExpensesPaginate = ({ groupId }: { groupId: string }) => {
  const { expenses, page, loading, addExpenses } = useExpenses(groupId);

  const { ref, inView } = useInView();

  const loadMoreExpenses = useCallback(async () => {
    addExpenses(groupId);
  }, [addExpenses, groupId]);

  useEffect(() => {
    if (inView && !loading) {
      loadMoreExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <div className="pb-8 pt-6">
      <div
        className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6")}
      >
        {expenses?.map((e, i) => (
          <div key={e.id}>
            <ExpenseCard expense={e} key={e.id} />
          </div>
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
