import { ActivityCard } from "@/app/(platform)/(app)/_components/activity-card";
import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

const GroupSettingsPage = async ({ params }: ServerSideComponentProp) => {
  const { userId } = auth();
  const groupId = params["id"] || "";

  const backTo = `/groups/${groupId || ""}`;

  const activities = await db.activity.findMany({
    where: { groupId },
    orderBy: [{ createdAt: "asc" }],
  });

  const noData = !activities || activities?.length === 0;

  return (
    <AutoContainer header={<Header title="Group Activity" backTo={backTo} />}>
      <div className="flex flex-col-reverse gap-4">
        {activities?.map((a) => (
          <ActivityCard key={a.id} currUserId={userId} activity={a} />
        ))}
      </div>
      {noData ? <NoData title="No activities found" /> : null}
      <div className="h-16" />
    </AutoContainer>
  );
};

export default GroupSettingsPage;
