import { ExpenseCard } from "@/app/(platform)/(app)/_components/expense-card";
import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { db } from "@/lib/db";
import { Actions } from "./actions";

const ExpenseDetailsPage = async ({ params }: ServerSideComponentProp) => {
  const groupId = params["id"] || "null";
  const expenseId = params["expenseId"] || "null";

  const expense = await db.expense.findUnique({
    where: { id: expenseId, groupId },
    include: {
      payments: { include: { user: true } },
      splits: { include: { user: true } },
    },
  });

  const backTo = `/groups/${expense?.groupId || ""}`;

  return (
    <AutoContainer
      header={
        <Header
          backTo={backTo}
          title={expense?.description}
          actions={<Actions expense={expense} />}
        />
      }
    >
      <ExpenseCard expense={expense} />
    </AutoContainer>
  );
};

export default ExpenseDetailsPage;
