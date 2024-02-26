import { UISpinner } from "@/components/ui-spinner";
import dynamic from "next/dynamic";

const GroupActivity = dynamic(() => import("./group-activity"), {
  loading: () => <UISpinner />,
});

const GroupActivityPage = async (props: ServerSideComponentProp) => {
  return <GroupActivity {...props} />;
};

export default GroupActivityPage;
