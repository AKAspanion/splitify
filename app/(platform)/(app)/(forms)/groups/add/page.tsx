import { Form } from "./form";
import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";

const GroupAddPage = async () => {
  return (
    <AutoContainer
      header={<Header backTo={"/groups"} title="Create a group" />}
    >
      <Form />
    </AutoContainer>
  );
};

export default GroupAddPage;
