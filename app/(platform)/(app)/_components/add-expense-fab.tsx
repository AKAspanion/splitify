"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export const AddExpenseFab = () => {
  const params = useParams();
  const groupId = params["id"] || "";

  const query = groupId ? `?groupId=${groupId}` : "";

  // TODO remove when individual expense ready
  const hidden = false;

  return hidden ? null : (
    <div className="fixed z-20 bottom-[104px] right-8 sm:bottom-8">
      <Link href={`/expense/add${query}`}>
        <Button>
          <div className="flex gap-2 items-center">
            <PlusIcon size={20} />
            <div>Add Expense</div>
          </div>
        </Button>
      </Link>
    </div>
  );
};
