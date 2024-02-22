import { ListItem } from "@/components/list-item";
import { UserPaymentWithUser } from "@/types/shared";
import { Expense, User, UserPayment, UserSplit } from "@prisma/client";
import { ReceiptText } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { whoPaidExpense } from "../_utils/expense";
import { EXPENSE_CATEGORY_ICONS, ExpenseCategoryType } from "@/constants/ui";

export type FullExpense =
  | (Expense & {
      payments: UserPaymentWithUser[] | null;
      splits: UserSplit[] | null;
    })
  | null;
type ExpenseCardProps = {
  expense: FullExpense;
  currUserId?: string;
};

export const ExpenseCard = (props: ExpenseCardProps) => {
  const { expense, currUserId } = props;

  const whoPaid = useMemo(() => {
    return whoPaidExpense(expense?.amount, expense?.payments || [], currUserId);
  }, [expense?.amount, expense?.payments, currUserId]);

  const category = (expense?.category || "General") as ExpenseCategoryType;

  const ExpenseIcon = EXPENSE_CATEGORY_ICONS[category] || ReceiptText;

  return expense ? (
    <Link href={`/groups/${expense?.groupId}/expense/${expense.id}`}>
      <ListItem
        icon={
          <div className="rounded-full w-10 h-10 flex items-center justify-center bg-foreground/10">
            <ExpenseIcon className="w-5 h-5" />
          </div>
        }
        title={expense.description}
        subtitle={whoPaid}
      />
    </Link>
  ) : null;
};
