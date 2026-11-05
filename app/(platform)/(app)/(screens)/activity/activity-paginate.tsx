"use client";
import { Button } from "@/components/ui/button";
import { NoData } from "@/components/no-data";
import { useAuth } from "@/hooks/use-auth";
import { ACTIVITY_PAGE_SIZE } from "@/lib/data/activity";
import type { ActivityPage } from "@/lib/data/activity";
import { toUserMessage } from "@/lib/data/errors";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
  ActivityCard,
  ActivityCardLoading,
} from "@/app/(platform)/(app)/_components/activity-card";

type ActivityPaginateProps = {
  query: UseInfiniteQueryResult<InfiniteData<ActivityPage, number>, Error>;
  emptyTitle: string;
  emptySubtitle?: string;
};

const Skeletons = () => (
  <div className="flex flex-col gap-4">
    {Array.from(Array(ACTIVITY_PAGE_SIZE)).map((_, i) => (
      <ActivityCardLoading key={i} />
    ))}
  </div>
);

/** A feed's states and its pages: a skeleton, an error with "Try again", an empty state, then ten at a time on scroll. */
const ActivityPaginate = ({
  query,
  emptyTitle,
  emptySubtitle,
}: ActivityPaginateProps) => {
  const { user } = useAuth();
  const { ref, inView } = useInView();
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (query.isPending) return <Skeletons />;

  const activities = query.data?.pages.flatMap((page) => page.items) ?? [];

  if (query.isError && activities.length === 0)
    return (
      <NoData
        title={toUserMessage(query.error)}
        action={<Button onClick={() => void query.refetch()}>Try again</Button>}
      />
    );

  if (activities.length === 0)
    return <NoData title={emptyTitle} subtitle={emptySubtitle} />;

  return (
    <div className="-ml-2">
      <div className="flex flex-col gap-4">
        {activities.map((a) => (
          <ActivityCard key={a.id} currUserId={user?.uid ?? ""} activity={a} />
        ))}
      </div>
      <div ref={hasNextPage ? ref : null} className="w-full pt-6">
        {isFetchingNextPage ? <Skeletons /> : null}
        {query.isError ? (
          <div className="flex flex-col items-center gap-2 text-sm">
            <div>{toUserMessage(query.error)}</div>
            <Button onClick={() => void fetchNextPage()}>Try again</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ActivityPaginate;
