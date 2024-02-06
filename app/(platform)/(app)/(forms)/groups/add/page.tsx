import { Form } from "./form";
import { AutoContainer } from "@/components/container/auto-container";

const GroupAddPage = async () => {
  return (
    <AutoContainer
      header={
          <div className="flex justify-between items-center">
            <div className="font-semibold text-lg">Add a group</div>
          </div>
      }
    >
      <Form />
    </AutoContainer>
  );
};

export default GroupAddPage;
