"use client";

import { getExpenses } from "@/actions/get-expense";
import { Expense } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

import { useInView } from "react-intersection-observer";
import { ExpenseCard } from "./expense-card";
import Spinner from "@/components/ui/spinner";

const ExpensesPaginate = ({
  groupId,
}: {
  groupId: string;
  loader: React.ReactNode;
}) => {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const { ref, inView } = useInView();

  const loadMoreExpenses = useCallback(async () => {
    setLoading(true);
    const nextPage = page + 1;
    const { data: nextExpenses = [] } = await getExpenses(nextPage, groupId);
    if (nextExpenses?.length) {
      setPage(nextPage);
      setExpenses((prevExpenses) => [...prevExpenses, ...nextExpenses]);
    }
    setLoading(false);
  }, [groupId, page]);

  useEffect(() => {
    if (inView) {
      loadMoreExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <>
      {expenses?.map((e) => <ExpenseCard expense={e} key={e.id} />)}
      <div ref={ref} className="flex w-full items-center justify-center">
        {loading ? <Spinner /> : null}
      </div>
    </>
  );
};

export default ExpensesPaginate;
