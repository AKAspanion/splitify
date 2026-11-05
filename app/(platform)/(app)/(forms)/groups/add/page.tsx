"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import Form from "./form";

const GroupAddPage = () => {
  return (
    <AutoContainer
      header={<Header backTo={"/groups"} title="Create a group" />}
    >
      <Form />
    </AutoContainer>
  );
};

export default GroupAddPage;
