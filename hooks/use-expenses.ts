import { GET_METHOD_CALLBACK, getCall } from "@/utils/api";
import { Expense } from "@prisma/client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import React, { useCallback } from "react";

const useExpenses = (id: string) => {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [`group-${id}-expense`],
    queryFn: async ({ pageParam }) => {
      const response = await getCall<{
        count: number;
        expenses: Expense[];
      }>(`/api/app/group/${id}/expense?page=${pageParam}`, {});
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      const maxCount = lastPage.count;
      let currentPage = pages.length;
      let currentCount = 0;
      pages.forEach((p) => (currentCount += p.expenses.length));
      const hasNext = currentCount < maxCount;
      const nextPage = hasNext ? currentPage + 1 : undefined;
      return nextPage;
    },
  });

  const loadMore = useCallback(async () => {
    fetchNextPage();
  }, [data, fetchNextPage]);

  return {
    data,
    isLoading,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    loadMore,
  };
};

export default useExpenses;
