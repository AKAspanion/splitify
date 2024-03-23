import { urlEncode } from "@/utils/func";
import dynamic from "next/dynamic";
import { GroupCardLoading } from "@/app/(platform)/(app)/_components/group-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

const GroupDetails = dynamic(() => import("./group-details"), {
  loading: () => <GroupDetailsLoading />,
});

const GroupDetailsLoading = () => {
  return (
    <div className="flex flex-col gap-6 py-6 px-8">
      <div className="flex justify-between">
        <Skeleton className="w-10 h-10" />
        <div className="flex justify-between gap-4">
          <Skeleton className="w-10 h-10 rounded-md" />
          <Skeleton className="w-10 h-10 rounded-md" />
          <Skeleton className="w-10 h-10 rounded-md" />
        </div>
      </div>
      <GroupCardLoading />
    </div>
  );
};

const GroupDetailsPage = async (props: ServerSideComponentProp) => {
  const keyString = `show=${props.searchParams?.["show"]}&search=${props.searchParams?.["search"]}&&text=${props.searchParams?.["text"]}`;
  return (
    <Suspense key={keyString} fallback={<GroupDetailsLoading />}>
      <GroupDetails {...props} />
    </Suspense>
  );
};

export default GroupDetailsPage;
