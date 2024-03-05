import GroupFormLoading from "@/app/(platform)/(app)/_components/group-form-loading";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const GroupEdit = dynamic(() => import("./group-edit"), {
  loading: () => <GroupFormLoading />,
});

const GroupEditPage = async (props: ServerSideComponentProp) => {
  return (
    <Suspense>
      <GroupEdit {...props} />
    </Suspense>
  );
};

export default GroupEditPage;
