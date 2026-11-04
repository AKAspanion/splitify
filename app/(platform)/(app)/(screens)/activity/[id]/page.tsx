"use client";

import Link from "next/link";
import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import {
  ActivityCard,
  ActivityCardLoading,
} from "@/app/(platform)/(app)/_components/activity-card";
import { useAuth } from "@/hooks/use-auth";
import { useRouteIds } from "@/hooks/use-route-ids";
import { activityLine, useActivity } from "@/lib/data/activity";
import { toUserMessage } from "@/lib/data/errors";

const NotFound = () => (
  <NoData
    title="We couldn't find that. It may have been deleted, or you may not be a member."
    action={
      <Link href="/groups">
        <Button variant="outline">Go to groups</Button>
      </Link>
    }
  />
);

const ActivityDetailsPage = () => {
  const { activityId } = useRouteIds();
  const { user } = useAuth();
  const { data, isPending, isError, error, refetch } = useActivity(activityId);
  const viewerId = user?.uid ?? "";

  const body = () => {
    if (activityId === null) return <NotFound />;
    if (isPending) return <ActivityCardLoading />;
    if (isError)
      return (
        <NoData
          title={toUserMessage(error)}
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      );
    if (data === null) return <NotFound />;
    const { link } = activityLine(data, viewerId);
    return (
      <div className="flex flex-col gap-6">
        <div className="-ml-2">
          <ActivityCard currUserId={viewerId} activity={data} />
        </div>
        <div>
          <Link href={link}>
            <Button variant="outline">Open</Button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <AutoContainer
      header={<Header title="Activity Details" backTo="/activity" />}
    >
      {body()}
    </AutoContainer>
  );
};

export default ActivityDetailsPage;
