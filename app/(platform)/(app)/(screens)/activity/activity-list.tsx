"use client";
import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { useMyActivity } from "@/lib/data/activity";
import ActivityPaginate from "./activity-paginate";

const ActivityList = () => {
  const query = useMyActivity();

  return (
    <AutoContainer id="activitylist" header={<Header title={"Activity"} />}>
      <ActivityPaginate
        query={query}
        emptyTitle="No activities found"
        emptySubtitle="All your group and expense related activities will show up here"
      />
      <div className="h-16" />
    </AutoContainer>
  );
};

export default ActivityList;
