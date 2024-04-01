import { ListItem } from "@/components/list-item";
import { BanknoteIcon, ReceiptText } from "lucide-react";
import Link from "next/link";
import { EXPENSE_CATEGORY_ICONS, ExpenseCategoryType } from "@/constants/ui";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Expense } from "@prisma/client";
import { formateDate, indiaDate } from "@/utils/date";
import WhoPaid from "./who-paid";
import YourShare from "./your-share";
import { Skeleton } from "@/components/ui/skeleton";

type ExpenseCardProps = {
  expense: Expense;
};

export const ExpenseCard = (props: ExpenseCardProps) => {
  const { expense } = props;

  const category = (expense?.category || "General") as ExpenseCategoryType;

  const CategoryExpenseIcon = EXPENSE_CATEGORY_ICONS[category] || ReceiptText;

  const isSettlement =
    expense?.tag === "SETTLEMENT" || expense?.category === "settlement";

  const ExpenseIcon = isSettlement ? BanknoteIcon : CategoryExpenseIcon;

  const createDate = expense?.createdAt ? indiaDate(expense?.createdAt) : "";

  return expense ? (
    <Link href={`/groups/${expense?.groupId}/expense/${expense.id}`}>
      <ListItem
        icon={
          <div className="rounded-full w-10 h-10 flex items-center justify-center bg-foreground/10">
            <ExpenseIcon
              className={cn("w-5 h-5", {
                "text-green-500": expense?.tag === "SETTLEMENT",
                "text-blue-500": expense?.tag !== "SETTLEMENT",
              })}
            />
          </div>
        }
        title={expense.description}
        subtitle={<WhoPaid expenseId={expense?.id} amount={expense?.amount} />}
        actions={
          <div className="text-[10px] text-right flex flex-col gap-0.5">
            <div className="truncate capitalize">
              {formateDate(createDate, "d LLL")}
            </div>
            {isSettlement ? null : (
              <YourShare expenseId={expense?.id} groupId={expense?.groupId} />
            )}
          </div>
        }
      />
    </Link>
  ) : null;
};

export const ExpenseCardLoader = () => {
  return (
    <div className="flex gap-4 items-center">
      <Skeleton className="rounded-full w-10 h-10" />
      <div>
        <Skeleton className="h-4 mt-0.5 w-[90px]" />
        <Skeleton className="h-3 mt-1 w-[120px]" />
      </div>
    </div>
  );
};
