import { Expense, User, UserPayment, UserSplit } from "@prisma/client";

export type UserPaymentWithUser = UserPayment & { user: User };
export type UserSplitWithUser = UserSplit & { user: User };

export type ExpenseWithPaymentWithSplit = Expense & {
  payments: UserPaymentWithUser[];
  splits: UserSplitWithUser[];
};
