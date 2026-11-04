import { ActivityCardLoading } from "@/app/(platform)/(app)/_components/activity-card";
import { ScreenSkeleton } from "@/app/(platform)/(app)/_components/screen-skeleton";
import dynamic from "next/dynamic";
import { resolvePageProps } from "@/utils/page";

const GroupActivityList = dynamic(() => import("./group-activity"), {
  loading: () => <ScreenSkeleton oneCol card={<ActivityCardLoading />} />,
});

const GroupActivityPage = async (pageProps: ServerSidePageProp) => {
  const props = await resolvePageProps(pageProps);
  return <GroupActivityList {...props} />;
};

export default GroupActivityPage;
