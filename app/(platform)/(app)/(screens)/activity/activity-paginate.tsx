"use client";
import { Button } from "@/components/ui/button";
import useActivities from "@/hooks/use-activities";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { auth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import React, { useCallback, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
  ActivityCard,
  ActivityCardLoading,
} from "../../_components/activity-card";

const ActivityPaginate = () => {
  const { user } = useUser();
  const { activities, page, loading, addActivities } = useActivities();

  const { ref, inView } = useInView();

  const loadMoreExpenses = useCallback(async () => {
    addActivities();
  }, [addActivities]);

  useEffect(() => {
    if (inView) {
      loadMoreExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <div className="-ml-2">
      <div className="flex flex-col gap-4">
        {activities?.map((a) => (
          <React.Fragment key={a.id}>
            <ActivityCard currUserId={user?.id || ""} activity={a} />
          </React.Fragment>
        ))}
      </div>
      <div
        ref={loading ? null : ref}
        className={cn("w-full", { "pt-6": page >= 1 })}
      >
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => {
              return (
                <React.Fragment key={g}>
                  <ActivityCardLoading />
                </React.Fragment>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ActivityPaginate;
