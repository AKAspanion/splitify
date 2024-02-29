import { ActivityCardLoading } from "@/app/(platform)/(app)/_components/activity-card";
import { ScreenSkeleton } from "@/app/(platform)/(app)/_components/screen-skeleton";
import dynamic from "next/dynamic";

const GroupActivityList = dynamic(() => import("./group-activity"), {
  loading: () => <ScreenSkeleton card={<ActivityCardLoading />} />,
});

const GroupActivityPage = async (props: ServerSideComponentProp) => {
  return <GroupActivityList {...props} />;
};

export default GroupActivityPage;
