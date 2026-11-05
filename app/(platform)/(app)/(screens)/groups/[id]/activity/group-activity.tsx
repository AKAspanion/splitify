"use client";

import Link from "next/link";
import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import { useRouteIds } from "@/hooks/use-route-ids";
import { useGroupActivity } from "@/lib/data/activity";
import ActivityPaginate from "@/app/(platform)/(app)/(screens)/activity/activity-paginate";

const GroupActivity = () => {
  const { groupId } = useRouteIds();
  const query = useGroupActivity(groupId);
  const backTo = `/groups/${groupId ?? ""}`;

  return (
    <AutoContainer header={<Header title="Group Activity" backTo={backTo} />}>
      {groupId === null ? (
        <NoData
          title="We couldn't find that. It may have been deleted, or you may not be a member."
          action={
            <Link href="/groups">
              <Button variant="outline">Go to groups</Button>
            </Link>
          }
        />
      ) : (
        <ActivityPaginate query={query} emptyTitle="No activities found" />
      )}
      <div className="h-16" />
    </AutoContainer>
  );
};

export default GroupActivity;
