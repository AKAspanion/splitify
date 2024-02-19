import { urlEncode } from "@/utils/func";
import dynamic from "next/dynamic";
import { GroupCardLoading } from "@/app/(platform)/(app)/_components/group-card";
import { UserAvatarsLoading } from "@/app/(platform)/(app)/_components/user-avatars";
import { Skeleton } from "@/components/ui/skeleton";

const GroupDetails = dynamic(() => import("./group-details"), {
  loading: () => (
    <div className="flex flex-col gap-6 py-6 px-8">
      <div className="flex justify-between">
        <Skeleton className="w-10 h-10" />
        <Skeleton className="w-10 h-10 rounded-md" />
      </div>
      <GroupCardLoading />
      <UserAvatarsLoading />
    </div>
  ),
});

const GroupDetailsPage = async ({
  params,
  searchParams,
}: ServerSideComponentProp) => {
  const id = params["id"] || "null";

  const backUrl = urlEncode({
    path: `/groups/${id}`,
    query: searchParams,
  });

  return <GroupDetails id={id} backUrl={backUrl} />;
};

export default GroupDetailsPage;
