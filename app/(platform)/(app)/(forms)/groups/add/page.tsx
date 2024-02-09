import { Form } from "./form";
import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { Suspense } from "react";

const GroupAddPage = async () => {
  return (
    <AutoContainer
      header={<Header backTo={"/groups"} title="Create a group" />}
    >
      <Suspense>
        <Form />
      </Suspense>
    </AutoContainer>
  );
};

export default GroupAddPage;
