import { User } from "@/generated/prisma/browser";
import { ExpenseWithPaymentWithSplit } from "@/types/shared";
import { BalanceList } from "./expense-balance-list";

const BalanceListWrapper = ({
  expense,
  users,
}: {
  users: User[];
  expense: ExpenseWithPaymentWithSplit;
}) => {
  return <BalanceList expense={expense} users={users} />;
};

export default BalanceListWrapper;
