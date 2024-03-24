"use client";

import { useCallback, useEffect } from "react";

import { useInView } from "react-intersection-observer";
import { ExpenseCard } from "./expense-card";
import { ExpenseListLoader } from "./expenses-list";
import useExpenses from "@/hooks/use-expenses";

const ExpensesPaginate = ({ groupId }: { groupId: string }) => {
  const { expenses, loading, addExpenses } = useExpenses(groupId);

  const { ref, inView } = useInView();

  const loadMoreExpenses = useCallback(async () => {
    addExpenses(groupId);
  }, [addExpenses, groupId]);

  useEffect(() => {
    if (inView) {
      loadMoreExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <div className="pb-8 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
        {expenses?.map((e, i) => (
          <div key={e.id}>
            <ExpenseCard expense={e} key={e.id} />
          </div>
        ))}
      </div>
      <div ref={loading ? null : ref} className="w-full">
        {loading ? <ExpenseListLoader /> : null}
      </div>
    </div>
  );
};

export default ExpensesPaginate;
