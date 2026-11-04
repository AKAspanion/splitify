import GroupFormLoading from "@/app/(platform)/(app)/_components/group-form-loading";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { resolvePageProps } from "@/utils/page";

const GroupEdit = dynamic(() => import("./group-edit"), {
  loading: () => <GroupFormLoading />,
});

const GroupEditPage = async (pageProps: ServerSidePageProp) => {
  const props = await resolvePageProps(pageProps);
  return (
    <Suspense>
      <GroupEdit {...props} />
    </Suspense>
  );
};

export default GroupEditPage;
