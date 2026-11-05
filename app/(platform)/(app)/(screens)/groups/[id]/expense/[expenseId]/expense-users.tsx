import { ExpenseWithPaymentWithSplit } from "@/types/shared";
import ExpenseUsersClient from "./expense-users-client";

const ExpenseUsers = ({
  expense,
  userId,
  balance,
}: {
  expense: ExpenseWithPaymentWithSplit;
  userId: string | null;
  balance: React.ReactNode;
}) => {
  return (
    <ExpenseUsersClient
      payments={expense.payments}
      amount={expense.amount}
      isSettlement={expense.tag === "SETTLEMENT"}
      userId={userId}
      balance={balance}
    />
  );
};

export default ExpenseUsers;
