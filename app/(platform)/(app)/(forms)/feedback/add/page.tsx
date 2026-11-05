"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import Form from "./form";

const FeedbackAddPage = () => {
  return (
    <AutoContainer
      header={<Header backTo={"/profile"} title="Send a feedback" />}
    >
      <Form />
    </AutoContainer>
  );
};

export default FeedbackAddPage;
