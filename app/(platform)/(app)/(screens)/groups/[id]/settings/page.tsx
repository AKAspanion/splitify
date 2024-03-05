import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupCardLoading } from "@/app/(platform)/(app)/_components/group-card";
import { Suspense } from "react";

const GroupSettings = dynamic(() => import("./group-settings"), {
  loading: () => (
    <div className="flex flex-col gap-6 py-6 px-8">
      <div className="flex justify-between items-center gap-4">
        <Skeleton className="w-[100px] h-8 rounded-md" />
        <div className="flex justify-between gap-4">
          <Skeleton className="w-10 h-10 rounded-md" />
          <Skeleton className="w-10 h-10 rounded-md" />
        </div>
      </div>
      <GroupCardLoading />
    </div>
  ),
});

const GroupSettingsPage = async (props: ServerSideComponentProp) => {
  const keyString = `show=${props?.searchParams["show"]}&back=${props?.searchParams["back"]}`;
  return (
    <Suspense key={keyString}>
      <GroupSettings {...props} />
    </Suspense>
  );
};

export default GroupSettingsPage;
