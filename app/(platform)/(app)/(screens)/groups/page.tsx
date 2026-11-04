import dynamic from "next/dynamic";
import { ScreenSkeleton } from "@/app/(platform)/(app)/_components/screen-skeleton";
import { Suspense } from "react";
import { resolvePageProps } from "@/utils/page";

const GroupList = dynamic(() => import("./group-list"), {
  loading: () => <ScreenSkeleton />,
});

const GroupsPage = async (pageProps: ServerSidePageProp) => {
  const props = await resolvePageProps(pageProps);
  const keyString = `show=${props.searchParams?.["show"]}&search=${props.searchParams?.["search"]}&&text=${props.searchParams?.["text"]}`;
  return (
    <Suspense key={keyString} fallback={<ScreenSkeleton />}>
      <GroupList {...props} />
    </Suspense>
  );
};

export default GroupsPage;
