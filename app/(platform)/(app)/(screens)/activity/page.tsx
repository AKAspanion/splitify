import dynamic from "next/dynamic";
import { ScreenSkeleton } from "@/app/(platform)/(app)/_components/screen-skeleton";
import { ActivityCardLoading } from "@/app/(platform)/(app)/_components/activity-card";
import { Suspense } from "react";

const ActivityList = dynamic(() => import("./activity-list"), {
  loading: () => <ScreenSkeleton card={<ActivityCardLoading />} />,
});

const ActivityPage = async (props: ServerSideComponentProp) => {
  const keyString = `page=${props.searchParams?.["page"]}&search=${props.searchParams?.["search"]}&&text=${props.searchParams?.["text"]}`;
  return (
    <Suspense
      key={keyString}
      fallback={<ScreenSkeleton card={<ActivityCardLoading />} />}
    >
      <ActivityList />
    </Suspense>
  );
};

export default ActivityPage;
