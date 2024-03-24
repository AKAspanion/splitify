import { useExpenseStore } from "@/lib/store/expense-provider";

const useExpenses = () => {
  const { count, expenses } = useExpenseStore((s) => s);

  return { count, expenses };
};

export default useExpenses;
