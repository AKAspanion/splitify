import { UserCardLoading } from "@/app/(platform)/(app)/_components/user-card";
import dynamic from "next/dynamic";
import { ScreenSkeleton } from "@/app/(platform)/(app)/_components/screen-skeleton";
import { Suspense } from "react";
import { resolvePageProps } from "@/utils/page";

const AddMember = dynamic(() => import("./add-member"), {
  loading: () => <ScreenSkeleton card={<UserCardLoading />} />,
});

const AddMemberPage = async (pageProps: ServerSidePageProp) => {
  const props = await resolvePageProps(pageProps);
  const keyString = `balance=${props?.searchParams?.["balance"]}`;
  return (
    <Suspense key={keyString}>
      <AddMember {...props} />
    </Suspense>
  );
};

export default AddMemberPage;
