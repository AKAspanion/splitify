import { AutoContainer } from "@/components/container/auto-container";
import { auth } from "@clerk/nextjs";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import { db } from "@/lib/db";
import { ActivityCard } from "../../_components/activity-card";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ActivityPaginate = dynamic(() => import("./activity-paginate"), {
  loading: () => (
    <div className="py-6 flex w-full items-center justify-center">
      <Skeleton className="h-10 w-[108px]" />
    </div>
  ),
});

const PAGE_COUNT = 10;

const ActivityList = async ({ searchParams }: ServerSideComponentProp) => {
  const pageNo = searchParams["page"] || "1";
  const { userId } = auth();

  const page = isNaN(pageNo) ? 1 : parseInt(pageNo);

  const userGroups = await db.group.findMany({
    where: { users: { some: { id: userId || "null" } } },
    select: { id: true },
    orderBy: [{ createdAt: "asc" }],
  });

  const where = {
    OR: [
      { groupId: { in: userGroups.map((u) => u.id) } },
      { users: { some: { id: userId || "null" } } },
    ],
  };
  const activities = await db.activity.findMany({
    where,
    take: page * PAGE_COUNT,
    orderBy: [{ createdAt: "desc" }],
  });

  const count = activities ? activities?.length : 0;

  const noData = count === 0;

  return (
    <AutoContainer header={<Header title={"Activity"} />}>
      {noData ? (
        <NoData
          title="No activities found"
          subtitle="All your group and expense related activities will show up here"
        />
      ) : null}
      <div className="flex flex-col-reverse gap-4">
        {activities
          ?.reverse()
          ?.map((a) => (
            <ActivityCard key={a.id} currUserId={userId} activity={a} />
          ))}
      </div>
      <div className="py-6">
        <ActivityPaginate groups={userGroups} count={count} page={page} />
      </div>
      <div className="h-16" />
    </AutoContainer>
  );
};

export default ActivityList;
