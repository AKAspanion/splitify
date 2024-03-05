import { ListItem } from "@/components/list-item";
import { BanknoteIcon, ReceiptText } from "lucide-react";
import Link from "next/link";
import { EXPENSE_CATEGORY_ICONS, ExpenseCategoryType } from "@/constants/ui";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Expense } from "@prisma/client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const WhoPaid = dynamic(() => import("./who-paid"), {
  loading: () => <Skeleton className="h-4 w-[120px]" />,
});

type ExpenseCardProps = {
  expense: Expense;
};

export const ExpenseCard = async (props: ExpenseCardProps) => {
  const { expense } = props;

  const category = (expense?.category || "General") as ExpenseCategoryType;

  const CategoryExpenseIcon = EXPENSE_CATEGORY_ICONS[category] || ReceiptText;

  const ExpenseIcon =
    expense?.tag === "SETTLEMENT" || expense?.category === "settlement"
      ? BanknoteIcon
      : CategoryExpenseIcon;

  const createDate = expense?.createdAt
    ? new Date(expense?.createdAt).toString()
    : "";

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
          <div className="text-[10px] truncate pb-4 capitalize">
            {format(createDate, "d LLL")}
          </div>
        }
      />
    </Link>
  ) : null;
};