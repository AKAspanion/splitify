import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import dynamic from "next/dynamic";
import GroupFormLoading from "@/app/(platform)/(app)/_components/group-form-loading";

const Form = dynamic(() => import("./form"), {
  loading: () => <GroupFormLoading />,
});

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
