import { useExpenseStore } from "@/lib/store/expense-provider";
import { useMemo } from "react";

const useExpenses = (groupId: string) => {
  const { count: countStore, expenses: expensesStore } = useExpenseStore(
    (s) => s,
  );

  const expenses = useMemo(() => {
    return expensesStore[groupId] || [];
  }, [expensesStore, groupId]);

  const count = useMemo(() => {
    return countStore[groupId] || [];
  }, [countStore, groupId]);

  return { count, expenses };
};

export default useExpenses;
