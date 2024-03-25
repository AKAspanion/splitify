"use client";
import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import React from "react";
import useActivities from "@/hooks/use-activities";
import ActivityPaginate from "./activity-paginate";

const ActivityList = () => {
  const { activities, count, loading } = useActivities();

  const noData = !loading && count === 0;

  return (
    <AutoContainer id="activitylist" header={<Header title={"Activity"} />}>
      {noData ? (
        <NoData
          title="No activities found"
          subtitle="All your group and expense related activities will show up here"
        />
      ) : null}
      <ActivityPaginate />
      <div className="h-16" />
    </AutoContainer>
  );
};

export default ActivityList;
