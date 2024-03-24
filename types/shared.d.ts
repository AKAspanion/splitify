import { Expense, Group, User, UserPayment, UserSplit } from "@prisma/client";

export type UserPaymentWithUser = UserPayment & { user: User };
export type UserSplitWithUser = UserSplit & { user: User };

export type ExpenseWithPaymentWithSplit = Expense & {
  payments: UserPaymentWithUser[];
  splits: UserSplitWithUser[];
};

export type ExpenseWithUserWithPaymentWithSplit =
  ExpenseWithPaymentWithSplit & {
    user: User;
  };

export type ExpenseWithUser = Expense & {
  user: User;
};

export type ExpenseWithUserPayment = Expense & {
  payments: UserPaymentWithUser[];
};

export type PartialExpenseWithPaymentWithSplit = Expense & {
  payments: Partial<UserPaymentWithUser>[];
  splits: Partial<UserSplitWithUser>[];
};

export type GroupWIthUsers = Group & { users: User[] };

export type GroupWIthExpenses = Group & { expenses: Expense[] };

export type GroupWIthExpenseWithUserWithPaymentWithSplit = Group & {
  expenses: ExpenseWithUserWithPaymentWithSplit[];
};
