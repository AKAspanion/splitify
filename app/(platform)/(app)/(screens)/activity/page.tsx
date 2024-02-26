import dynamic from "next/dynamic";
import { ScreenSkeleton } from "../../_components/screen-skeleton";
import { Suspense } from "react";
import { UISpinner } from "@/components/ui-spinner";

const ActivityList = dynamic(() => import("./activity-list"), {
  loading: () => <UISpinner />,
});

const ActivityPage = async (props: ServerSideComponentProp) => {
  const keyString = `show=${props.searchParams?.["show"]}&search=${props.searchParams?.["search"]}&&text=${props.searchParams?.["text"]}`;
  return (
    <Suspense key={keyString} fallback={<ScreenSkeleton />}>
      <ActivityList {...props} />
    </Suspense>
  );
};

export default ActivityPage;
