import dynamic from "next/dynamic";
import { ScreenSkeleton } from "../../_components/screen-skeleton";

const GroupList = dynamic(() => import("./group-list"), {
  loading: () => <ScreenSkeleton />,
});

const GroupsPage = async () => {
  return <GroupList />;
};

export default GroupsPage;
