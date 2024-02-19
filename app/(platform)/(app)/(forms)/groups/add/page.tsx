import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { FormInputLoading } from "@/components/form/form-input-loading";
import Form from "./form";

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
