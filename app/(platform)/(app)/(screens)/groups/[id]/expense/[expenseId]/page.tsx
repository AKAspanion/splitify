import { ExpenseCard } from "@/app/(platform)/(app)/_components/expense-card";
import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { ArrowLeftIcon, PencilIcon, TrashIcon } from "lucide-react";
import Link from "next/link";

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

  return (
    <AutoContainer
      header={
        <Header
          backTo={`/groups/${expense?.groupId || ""}`}
          title={expense?.description}
          actions={
            <>
              <Button variant="ghost" size="icon">
                <TrashIcon width={20} />
              </Button>
              <Button variant="ghost" size="icon">
                <PencilIcon width={20} />
              </Button>
            </>
          }
        />
      }
    >
      <ExpenseCard expense={expense} />
    </AutoContainer>
  );
};

export default ExpenseDetailsPage;
