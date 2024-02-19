import { AutoContainer } from "@/components/container/auto-container";
import { Form } from "./(form)/form";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { Header } from "@/components/container/header";
import { Suspense } from "react";

const AddExpense = async ({ searchParams }: ServerSideComponentProp) => {
  const { userId } = auth();
  const data = await db.user.findUnique({
    where: { id: userId || "null" },
    include: { groups: { include: { users: true } } },
  });

  const groups = data?.groups || [];

  const groupdId = searchParams["groupId"] || "";
  const backTo = groupdId ? `/groups/${groupdId}` : `/groups`;

  return (
    <AutoContainer header={<Header backTo={backTo} title="Add an expense" />}>
      <Suspense>
        <Form groups={groups} />
      </Suspense>
    </AutoContainer>
  );
};

export default AddExpense;
