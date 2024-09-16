import { AutoContainer } from "@/components/container/auto-container";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { Header } from "@/components/container/header";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { UISpinner } from "@/components/ui-spinner";

const Form = dynamic(() => import("./(form)/form"), {
  loading: () => <UISpinner />,
});

const AddExpense = async ({ searchParams }: ServerSideComponentProp) => {
  const { userId } = auth();

  const groups = await db.group.findMany({
    where: { users: { some: { id: userId || "null" } } },
    include: { users: true },
    orderBy: [{ createdAt: "desc" }],
  });

  const groupId = searchParams["groupId"] || "";
  const backTo = groupId ? `/groups/${groupId}` : `/groups`;

  return (
    <AutoContainer header={<Header backTo={backTo} title="Add an expense" />}>
      <Suspense>
        <Form groups={groups} />
      </Suspense>
    </AutoContainer>
  );
};

export default AddExpense;
