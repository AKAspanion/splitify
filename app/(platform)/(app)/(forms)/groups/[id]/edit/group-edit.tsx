import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import Form from "./form";
import { db } from "@/lib/db";
import { NoData } from "@/components/no-data";

const GroupEdit = async ({ params }: ServerSideComponentProp) => {
  const id = params["id"];

  const group = await db.group.findUnique({
    where: { id },
    select: { title: true, description: true, id: true, type: true },
  });

  return (
    <AutoContainer
      header={<Header backTo={`/groups/${id || ""}`} title={`Update group`} />}
    >
      {group ? <Form {...group} /> : <NoData title={"Group not found"} />}
    </AutoContainer>
  );
};

export default GroupEdit;
