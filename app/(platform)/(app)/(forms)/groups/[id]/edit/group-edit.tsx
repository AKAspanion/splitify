import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { Skeleton } from "@/components/ui/skeleton";
import { FormInputLoading } from "@/components/form/form-input-loading";
import Form from "./form";
import { db } from "@/lib/db";

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
      {group ? <Form {...group} /> : null}
    </AutoContainer>
  );
};

export default GroupEdit;
