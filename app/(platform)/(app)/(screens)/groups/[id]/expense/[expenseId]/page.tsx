import { ExpenseCard } from "@/app/(platform)/(app)/_components/expense-card";
import { AutoContainer } from "@/components/container/auto-container";
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
        <div className="flex w-full gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <Link href={`/groups/${expense?.groupId || ""}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeftIcon />
              </Button>
            </Link>
            <div className="font-semibold text-lg">{expense?.description}</div>
          </div>
          <div className="flex gap-2 ">
            <Button variant="ghost" size="icon">
              <TrashIcon width={20} />
            </Button>
            <Button variant="ghost" size="icon">
              <PencilIcon width={20} />
            </Button>
          </div>
        </div>
      }
    >
      <ExpenseCard expense={expense} />
    </AutoContainer>
  );
};

export default ExpenseDetailsPage;
