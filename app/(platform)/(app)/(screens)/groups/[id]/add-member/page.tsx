import { UserCardLoading } from "@/app/(platform)/(app)/_components/user-card";
import dynamic from "next/dynamic";
import { ScreenSkeleton } from "@/app/(platform)/(app)/_components/screen-skeleton";

const AddMember = dynamic(() => import("./add-member"), {
  loading: () => <ScreenSkeleton card={<UserCardLoading />} />,
});

const AddMemberPage = async ({
  params,
  searchParams,
}: ServerSideComponentProp) => {
  return <AddMember params={params} searchParams={searchParams} />;
};

export default AddMemberPage;
