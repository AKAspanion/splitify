import { ListItem } from "@/components/list-item";
import { ExpenseWithUserPayment } from "@/types/shared";
import { BanknoteIcon, ReceiptText } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { whoPaidExpense } from "../_utils/expense";
import { EXPENSE_CATEGORY_ICONS, ExpenseCategoryType } from "@/constants/ui";
import { relativeDate } from "@/utils/date";
import { cn } from "@/lib/utils";

type ExpenseCardProps = {
  expense: ExpenseWithUserPayment;
  currUserId?: string;
};

export const ExpenseCard = (props: ExpenseCardProps) => {
  const { expense, currUserId } = props;

  const whoPaid = useMemo(() => {
    return whoPaidExpense(expense?.amount, expense?.payments || [], currUserId);
  }, [expense?.amount, expense?.payments, currUserId]);

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
        subtitle={whoPaid}
        actions={
          <div className="text-[10px] truncate pb-4 capitalize">
            {relativeDate(createDate)}
          </div>
        }
      />
    </Link>
  ) : null;
};
