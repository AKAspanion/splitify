import { ListItem } from "@/components/list-item";
import { Expense, User, UserPayment, UserSplit } from "@prisma/client";
import { ReceiptText } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export type FullExpense =
  | (Expense & {
      payments: UserPaymentWithUser[] | null;
      splits: UserSplit[] | null;
    })
  | null;
type UserPaymentWithUser = UserPayment & { user: User };
type ExpenseCardProps = {
  expense: FullExpense;
};

export const ExpenseCard = (props: ExpenseCardProps) => {
  const { expense } = props;

  const whoPaid = useMemo(() => {
    let paid = "";
    if (expense?.payments && expense?.payments?.length) {
      paid =
        expense?.payments?.length > 1
          ? `${expense?.payments.length} People Paid`
          : `${expense?.payments[0]?.user?.name} Paid`;

      if (expense?.amount) {
        paid = paid + ` ${expense?.amount}`;
      }
    }

    return paid;
  }, [expense?.amount, expense?.payments]);

  return expense ? (
    <Link href={`/groups/${expense?.groupId}/expense/${expense.id}`}>
      <ListItem
        icon={
          <div className="rounded-full w-10 h-10 flex items-center justify-center bg-foreground/10">
            <ReceiptText />
          </div>
        }
        title={expense.description}
        subtitle={whoPaid}
      />
    </Link>
  ) : null;
};
