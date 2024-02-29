import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { UISpinner } from "@/components/ui-spinner";

const Form = dynamic(() => import("./(form)/form"), {
  loading: () => <UISpinner />,
});

const SettleExpense = async ({
  params,
  searchParams,
}: ServerSideComponentProp) => {
  //   const { userId } = auth();

  //   const groups = await db.group.findMany({
  //     where: { users: { some: { id: userId || "null" } } },
  //     include: { users: true },
  //     orderBy: [{ createdAt: "desc" }],
  //   });

  const groupdId = params["groupId"] || "";
  const backTo = groupdId ? `/groups/${groupdId}` : `/groups`;

  // console.log(searchParams);

  return (
    <AutoContainer header={<Header backTo={backTo} title="Settlement" />}>
      <Suspense>
        <Form />
      </Suspense>
    </AutoContainer>
  );
};

export default SettleExpense;
