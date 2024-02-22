import dynamic from "next/dynamic";
import { ScreenSkeleton } from "../../_components/screen-skeleton";
import { Suspense } from "react";

const GroupList = dynamic(() => import("./group-list"), {
  loading: () => <ScreenSkeleton />,
});

const GroupsPage = async (props: ServerSideComponentProp) => {
  const keyString = `show=${props.searchParams?.["show"]}`;
  return (
    <Suspense key={keyString} fallback={<ScreenSkeleton />}>
      <GroupList {...props} />
    </Suspense>
  );
};

export default GroupsPage;
