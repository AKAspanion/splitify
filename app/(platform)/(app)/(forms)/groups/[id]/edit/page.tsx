import { UISpinner } from "@/components/ui-spinner";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const GroupEdit = dynamic(() => import("./group-edit"), {
  loading: () => <UISpinner />,
});

const GroupEditPage = async (props: ServerSideComponentProp) => {
  return (
    <Suspense>
      <GroupEdit {...props} />
    </Suspense>
  );
};

export default GroupEditPage;
