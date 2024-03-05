import { AutoContainer } from "@/components/container/auto-container";
import { db } from "@/lib/db";
import { Header } from "@/components/container/header";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { UISpinner } from "@/components/ui-spinner";

const Form = dynamic(() => import("./form"), {
  loading: () => <UISpinner />,
});

const EditExpense = async ({
  params,
  searchParams,
}: ServerSideComponentProp) => {
  const expenseId = params["id"];

  const expense = await db.expense.findUnique({
    where: { id: expenseId },
    select: { id: true, description: true, groupId: true },
  });

  const groupdId = searchParams["groupId"] || expense?.groupId || "";
  const backTo = groupdId
    ? `/groups/${groupdId}/expense/${expense?.id || ""}`
    : `/groups`;

  return (
    <AutoContainer header={<Header backTo={backTo} title="Update expense" />}>
      <Suspense>{expense ? <Form {...expense} /> : null}</Suspense>
    </AutoContainer>
  );
};

export default EditExpense;
