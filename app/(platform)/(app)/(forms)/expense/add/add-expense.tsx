import { AutoContainer } from "@/components/container/auto-container";
import { Form } from "./(form)/form";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { Header } from "@/components/container/header";
import { Suspense } from "react";

const AddExpense = async ({ searchParams }: ServerSideComponentProp) => {
  const { userId } = auth();

  const groups = await db.group.findMany({
    where: { users: { some: { id: userId || "null" } } },
    include: { users: true },
    orderBy: [{ createdAt: "desc" }],
  });

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
