import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { UISpinner } from "@/components/ui-spinner";
import dynamic from "next/dynamic";

const Form = dynamic(() => import("./form"), {
  loading: () => <UISpinner />,
});

const FeedbackAddPage = async () => {
  return (
    <AutoContainer
      header={<Header backTo={"/profile"} title="Send a feedback" />}
    >
      <Form />
    </AutoContainer>
  );
};

export default FeedbackAddPage;
