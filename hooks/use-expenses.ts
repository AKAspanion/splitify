import { useExpenseStore } from "@/store/expense/provider";
import { GET_METHOD_CALLBACK } from "@/utils/api";
import { Expense } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const useExpenses = (id: string) => {
  const { data, isLoading } = useQuery<{ count: number; expenses: Expense[] }>({
    queryKey: [`group-${id}-expense`],
    queryFn: GET_METHOD_CALLBACK(`/api/app/group/${id}/expense`, {}),
    enabled: true,
  });

  // const {
  //   addExpenses,
  //   pageLoading,
  //   page: pageStore,
  //   count: countStore,
  //   expenses: expensesStore,
  // } = useExpenseStore((s) => s);

  // const expenses = useMemo(() => {
  //   return expensesStore[groupId] || [];
  // }, [expensesStore, groupId]);

  // const count = useMemo(() => {
  //   return countStore[groupId];
  // }, [countStore, groupId]);

  // const page = useMemo(() => {
  //   return pageStore[groupId] || 1;
  // }, [pageStore, groupId]);

  // const loading = useMemo(() => {
  //   return pageLoading[groupId] || false;
  // }, [pageLoading, groupId]);

  return { data, isLoading };
};

export default useExpenses;
