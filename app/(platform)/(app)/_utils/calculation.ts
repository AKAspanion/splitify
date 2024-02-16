import { ExpenseType } from "@/lib/splitify/model/expense/expense-type";
import { Group } from "@/lib/splitify/model/group/group";
import { Payment } from "@/lib/splitify/model/payment/payment";
import { EqualSplit } from "@/lib/splitify/model/split/equal-split";
import { User } from "@/lib/splitify/model/user/user";
import { ExpenseRepository } from "@/lib/splitify/repository/expense-repository";
import { MinifySplitsService } from "@/lib/splitify/service/minify-splits-service";
import { SplitifyService } from "@/lib/splitify/service/splitify-service";
import { ExpenseWithPaymentWithSplit } from "@/types/shared";

import {
  User as DBUser,
  Expense as DBExpense,
  UserPayment,
  UserSplit,
} from "@prisma/client";

const evaluateExpense = (
  service: SplitifyService,
  expense: DBExpense,
  payments: UserPayment[],
  splits: UserSplit[],
) => {
  switch (expense.type) {
    case "EQUAL":
      service.addExpense(
        expense.description,
        ExpenseType.EQUAL,
        payments?.map((p) => new Payment(p.userId, p.amount)) || [],
        splits?.map((s) => new EqualSplit(s.userId)) || [],
      );
      break;
    default:
      break;
  }
};

export const calcExpenseSplits = (
  currUserId: string,
  expense: DBExpense | null,
  dbUsers: DBUser[],
  payments: UserPayment[],
  splits: UserSplit[],
  detailed = false,
) => {
  if (!expense) return [];
  const users = dbUsers.map(
    (u) =>
      new User(u.id, currUserId === u.id ? "You" : u.name || "-", u.email, "0"),
  );
  const group = new Group("Group");

  users.forEach((u) => group.addUser(u));

  const N = users.length;

  const expenseRepository = new ExpenseRepository(group);
  const service = new SplitifyService(expenseRepository);

  evaluateExpense(service, expense, payments, splits);

  if (detailed) {
    return service.getBalancesList();
  } else {
    const userIdsArr = users.map((u) => u.userId);
    const userNamesArr = users.map((u) => u.userName);

    const minifyService = new MinifySplitsService(userNamesArr);
    minifyService.execute(
      MinifySplitsService.createGraph(
        N,
        userIdsArr,
        service.getBalancesTable(),
      ),
    );

    return minifyService.getBalancesList();
  }
};

export const calcGroupSplits = (
  currUserId: string,
  expenses: ExpenseWithPaymentWithSplit[] | null,
  dbUsers: DBUser[],
  detailed = false,
) => {
  if (!expenses) return [];
  const users = dbUsers.map(
    (u) =>
      new User(u.id, currUserId === u.id ? "You" : u.name || "-", u.email, "0"),
  );
  const group = new Group("Group");

  users.forEach((u) => group.addUser(u));

  const N = users.length;

  const expenseRepository = new ExpenseRepository(group);
  const service = new SplitifyService(expenseRepository);

  for (const expense of expenses) {
    evaluateExpense(service, expense, expense?.payments, expense?.splits);
  }

  if (detailed) {
    return service.getBalancesList();
  } else {
    const userIdsArr = users.map((u) => u.userId);
    const userNamesArr = users.map((u) => u.userName);

    const minifyService = new MinifySplitsService(userNamesArr);
    minifyService.execute(
      MinifySplitsService.createGraph(
        N,
        userIdsArr,
        service.getBalancesTable(),
      ),
    );

    return minifyService.getBalancesList();
  }
};
