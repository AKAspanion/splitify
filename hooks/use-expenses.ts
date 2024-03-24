import { useExpenseStore } from "@/lib/store/expense-provider";
import { useMemo } from "react";

const useExpenses = (groupId: string) => {
  const {
    addExpenses,
    pageLoading,
    count: countStore,
    expenses: expensesStore,
  } = useExpenseStore((s) => s);

  const expenses = useMemo(() => {
    return expensesStore[groupId] || [];
  }, [expensesStore, groupId]);

  const count = useMemo(() => {
    return countStore[groupId] || [];
  }, [countStore, groupId]);

  const loading = useMemo(() => {
    return pageLoading[groupId] || false;
  }, [pageLoading, groupId]);

  return { count, loading, expenses, addExpenses };
};

export default useExpenses;
