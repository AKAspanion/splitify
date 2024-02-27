import { AutoContainer } from "@/components/container/auto-container";
import { auth } from "@clerk/nextjs";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import { db } from "@/lib/db";
import { ActivityCard } from "../../_components/activity-card";

const ActivityList = async (props: ServerSideComponentProp) => {
  const { userId } = auth();

  const userGroups = await db.group.findMany({
    where: { users: { some: { id: userId || "null" } } },
    select: { id: true },
    orderBy: [{ createdAt: "asc" }],
  });

  const activities = await db.activity.findMany({
    where: { groupId: { in: userGroups.map((u) => u.id) } },
    orderBy: [{ createdAt: "asc" }],
  });

  const noData = !activities || activities?.length === 0;

  return (
    <AutoContainer header={<Header title={"Activity"} />}>
      {noData ? (
        <NoData
          title="No activities found"
          subtitle="All your group and expense related activities will show up here"
        />
      ) : null}
      <div className="flex flex-col-reverse gap-4">
        {activities?.map((a) => (
          <ActivityCard key={a.id} currUserId={userId} activity={a} />
        ))}
      </div>
    </AutoContainer>
  );
};

export default ActivityList;
