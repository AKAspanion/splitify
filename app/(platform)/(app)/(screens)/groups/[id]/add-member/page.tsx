import { UserCardLoading } from "@/app/(platform)/(app)/_components/user-card";
import dynamic from "next/dynamic";
import { ScreenSkeleton } from "@/app/(platform)/(app)/_components/screen-skeleton";
import { Suspense } from "react";

const AddMember = dynamic(() => import("./add-member"), {
  loading: () => <ScreenSkeleton card={<UserCardLoading />} />,
});

const AddMemberPage = async (props: ServerSideComponentProp) => {
  const keyString = `balance=${props?.searchParams?.["balance"]}`;
  return (
    <Suspense key={keyString}>
      <AddMember {...props} />
    </Suspense>
  );
};

export default AddMemberPage;
