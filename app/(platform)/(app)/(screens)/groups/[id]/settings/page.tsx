import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupCardLoading } from "@/app/(platform)/(app)/_components/group-card";
import { UserAvatarsLoading } from "@/app/(platform)/(app)/_components/user-avatars";
import { UserCardLoading } from "@/app/(platform)/(app)/_components/user-card";

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
      <Skeleton className="w-[100px] h-6 rounded-md" />
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <UserCardLoading key={i} />
        ))}
      </div>
    </div>
  ),
});

const GroupSettingsPage = async ({
  params,
  searchParams,
}: ServerSideComponentProp) => {
  return <GroupSettings params={params} searchParams={searchParams} />;
};

export default GroupSettingsPage;
