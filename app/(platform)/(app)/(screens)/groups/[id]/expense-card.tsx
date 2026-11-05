import { ListItem } from "@/components/list-item";
import { BanknoteIcon, ReceiptText } from "lucide-react";
import Link from "next/link";
import { EXPENSE_CATEGORY_ICONS, ExpenseCategoryType } from "@/constants/ui";
import { cn } from "@/lib/utils";
import type { GroupExpense } from "@/lib/data/groups";
import WhoPaid from "./who-paid";
import YourShare from "./your-share";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseDate } from "./expense-date";

type ExpenseCardProps = {
  /** `pending` marks one made offline that has not reached the server yet. */
  expense: GroupExpense & { pending?: boolean };
  groupId: string;
};

export const ExpenseCard = (props: ExpenseCardProps) => {
  const { expense, groupId } = props;

  const category = (expense?.category || "General") as ExpenseCategoryType;

  const CategoryExpenseIcon = EXPENSE_CATEGORY_ICONS[category] || ReceiptText;

  const isSettlement =
    expense?.tag === "SETTLEMENT" || expense?.category === "settlement";

  const ExpenseIcon = isSettlement ? BanknoteIcon : CategoryExpenseIcon;

  const createDate = expense?.createdAt ?? "";

  if (!expense) return null;

  const item = (
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
      subtitle={
        <WhoPaid
          groupId={groupId}
          expenseId={expense.id}
          amount={expense.amount}
        />
      }
      actions={
        <div className="text-[10px] min-h-[18px] text-right flex flex-col gap-0.5">
          <div className="truncate capitalize">
            <ExpenseDate date={createDate} />
          </div>
          {expense.pending ? (
            <div className="text-amber-600">Waiting to sync</div>
          ) : null}
          {isSettlement ? null : (
            <YourShare expenseId={expense.id} groupId={groupId} />
          )}
        </div>
      }
    />
  );

  // A row waiting to sync is not on the server yet, so there is no expense to open.
  return expense.pending ? (
    <div>{item}</div>
  ) : (
    <Link href={`/groups/${groupId}/expense/${expense.id}`}>{item}</Link>
  );
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
