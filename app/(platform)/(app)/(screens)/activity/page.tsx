import dynamic from "next/dynamic";
import { ScreenSkeleton } from "../../_components/screen-skeleton";
import { ActivityCardLoading } from "../../_components/activity-card";

const ActivityList = dynamic(() => import("./activity-list"), {
  loading: () => <ScreenSkeleton card={<ActivityCardLoading />} />,
});

const ActivityPage = async (props: ServerSideComponentProp) => {
  return <ActivityList {...props} />;
};

export default ActivityPage;
