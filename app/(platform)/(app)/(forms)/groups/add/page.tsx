import { db } from "@/lib/db";
import { Form } from "./form";

const GroupAddPage = async () => {
  const groups = await db.group.findMany();
  return (
    <div className="p-6 px-8 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="font-semibold text-lg ">Add a group</div>
      </div>
      <Form />
    </div>
  );
};

export default GroupAddPage;
