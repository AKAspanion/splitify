"use client";

import { Header } from "@/components/container/header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useExpense from "@/hooks/use-expense";
import { PencilIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

const ExpenseActions = dynamic(() => import("./expense-actions"), {
  loading: () => (
    <div className="flex justify-between gap-4">
      <Skeleton className="w-10 h-10 rounded-md" />
      <Skeleton className="w-10 h-10 rounded-md" />
    </div>
  ),
});

const ExpenseHeader = ({
  groupId,
  expenseId,
}: {
  expenseId: string;
  groupId: string;
}) => {
  const { expense, loading } = useExpense(expenseId, groupId);

  const backTo = `/groups/${groupId || ""}`;
  const editLink = `/expense/${expenseId || ""}/edit?groupId=${groupId || ""}`;

  const isSettlement = expense?.tag === "SETTLEMENT";

  return (
    <Header
      backTo={backTo}
      title={isSettlement ? "Settlement" : expense?.description}
      actions={
        expense ? (
          <>
            <ExpenseActions expense={expense} />
            {isSettlement ? null : (
              <Link href={editLink}>
                <Button variant={"ghost"} size={"icon"}>
                  <PencilIcon className="w-5 h-5" />
                </Button>
              </Link>
            )}
          </>
        ) : null
      }
    />
  );
};

export default ExpenseHeader;
