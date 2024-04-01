import { useExpenseStore } from "@/store/expense-provider";
import { useMemo } from "react";

const useExpenses = (groupId: string) => {
  const {
    addExpenses,
    pageLoading,
    page: pageStore,
    count: countStore,
    expenses: expensesStore,
  } = useExpenseStore((s) => s);

  const expenses = useMemo(() => {
    return expensesStore[groupId] || [];
  }, [expensesStore, groupId]);

  const count = useMemo(() => {
    return countStore[groupId];
  }, [countStore, groupId]);

  const page = useMemo(() => {
    return pageStore[groupId] || 1;
  }, [pageStore, groupId]);

  const loading = useMemo(() => {
    return pageLoading[groupId] || false;
  }, [pageLoading, groupId]);

  return { count, page, loading, expenses, addExpenses };
};

export default useExpenses;
