"use client";

import { useGroupStore } from "@/lib/store/group-provider";
import { useEffect, useMemo } from "react";

const useExpense = (expenseId: string, groupId: string) => {
  const { setExpense, expenses, expenseLoading } = useGroupStore((s) => s);
  const expense = useMemo(() => {
    return expenses[expenseId];
  }, [expenses, expenseId]);

  const loading = useMemo(() => {
    return expenseLoading[expenseId];
  }, [expenseLoading, expenseId]);

  useEffect(() => {
    if (!expense) {
      setExpense(expenseId, groupId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, expense };
};

export default useExpense;
