import { UISpinner } from "@/components/ui-spinner";
import dynamic from "next/dynamic";

const LogsList = dynamic(() => import("./logs-list"), {
  loading: () => <UISpinner />,
});

const LogsPage = async () => {
  return <LogsList />;
};

export default LogsPage;
