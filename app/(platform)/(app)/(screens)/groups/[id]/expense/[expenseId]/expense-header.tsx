"use client";

import { Header } from "@/components/container/header";
import { Button } from "@/components/ui/button";
import type { ExpenseDetail } from "@/lib/data/expenses";
import { PencilIcon } from "lucide-react";
import Link from "next/link";
import ExpenseActions from "./expense-actions";

const ExpenseHeader = ({
  groupId,
  expense,
}: {
  groupId: string;
  expense: ExpenseDetail;
}) => {
  const backTo = `/groups/${groupId}`;
  const editLink = `/expense/${expense.id}/edit?groupId=${groupId}`;
  const isSettlement = expense.tag === "SETTLEMENT";

  return (
    <Header
      backTo={backTo}
      title={isSettlement ? "Settlement" : expense.description}
      actions={
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
      }
    />
  );
};

export default ExpenseHeader;
