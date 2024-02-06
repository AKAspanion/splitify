import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export const AddExpenseFab = ({}) => {
  return (
    <div className="fixed z-20 bottom-[104px] right-8 sm:bottom-8">
      <Link href={`/expense/add`}>
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
