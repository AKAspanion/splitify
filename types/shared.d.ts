// The shapes the screens and the split engine read. They are declared here, not generated: `lib/data/ledger.ts`
// and the other `lib/data/` readers fill them from SQL Connect results.

export type User = {
  uid: string;
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  image_url: string | null;
  profile_image_url: string | null;
  fromClerk: boolean | null;
  createdAt: Date;
  updatedAt: Date | null;
};

export type Activity = {
  id: string;
  message: string;
  type: string;
  link: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  groupId: string;
};

export type Group = {
  id: string;
  title: string;
  currency: string | null;
  description: string | null;
  image_url: string | null;
  type: string | null;
  mute: boolean | null;
  createdAt: Date;
  updatedAt: Date | null;
};

export type Expense = {
  id: string;
  amount: number;
  currency: string | null;
  description: string;
  category: string | null;
  settlement: boolean | null;
  tag: "EXPENSE" | "SETTLEMENT" | null;
  type: "EQUAL" | "EXACT" | "PERCENT";
  groupId: string | null;
  createrId: string;
  createdAt: Date;
  updatedAt: Date | null;
};

export type UserPayment = {
  id: string;
  amount: number;
  currency: string | null;
  userId: string;
  expenseId: string;
  createdAt: Date;
  updatedAt: Date | null;
};

export type UserSplit = {
  id: string;
  amount: number;
  currency: string | null;
  percent: number | null;
  userId: string;
  expenseId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
};

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
