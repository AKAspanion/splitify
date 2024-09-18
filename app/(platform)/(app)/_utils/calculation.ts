import { ExpenseType } from "@/lib/splitify/model/expense/expense-type";
import { Group } from "@/lib/splitify/model/group/group";
import { Payment } from "@/lib/splitify/model/payment/payment";
import { EqualSplit } from "@/lib/splitify/model/split/equal-split";
import { ExactSplit } from "@/lib/splitify/model/split/exact-split";
import { User } from "@/lib/splitify/model/user/user";
import { ExpenseRepository } from "@/lib/splitify/repository/expense-repository";
import { CurrencyExchangeService } from "@/lib/splitify/service/currency-exchange-service";
import { MinifySplitsService } from "@/lib/splitify/service/minify-splits-service";
import { SplitifyService } from "@/lib/splitify/service/splitify-service";
import { ExpenseWithPaymentWithSplit, GroupWIthUsers } from "@/types/shared";
import { getCurrencySymbol } from "@/utils/currency";
import { getInitials } from "@/utils/func";

import {
  User as DBUser,
  Expense as DBExpense,
  UserPayment,
  UserSplit,
} from "@prisma/client";

const evaluateExpense = async (
  service: SplitifyService,
  expense: DBExpense,
  payments: UserPayment[],
  splits: UserSplit[],
  groupCurrency: string,
) => {
  // convert expense currency to group currency
  const rate = await CurrencyExchangeService.getRate(
    expense.currency || "inr",
    groupCurrency,
  );

  switch (expense.type) {
    case "EQUAL":
      service.addExpense(
        expense.description,
        expense.currency || "inr",
        ExpenseType.EQUAL,
        payments?.map((p) => new Payment(p.userId, p.amount * rate)) || [],
        splits?.map((s) => new EqualSplit(s.userId)) || [],
      );
      break;
    case "EXACT":
    case "PERCENT":
      service.addExpense(
        expense.description,
        expense.currency || "inr",
        ExpenseType.EXACT,
        payments?.map((p) => new Payment(p.userId, p.amount * rate)) || [],
        splits?.map((s) => new ExactSplit(s.userId, s.amount * rate)) || [],
      );
      break;
    default:
      break;
  }
};

export const calcExpenseSplits = async (
  currUserId: string,
  expense: DBExpense | null,
  dbUsers: DBUser[],
  payments: UserPayment[],
  splits: UserSplit[],
  detailed = false,
) => {
  try {
    if (!expense) return [];
    const currency = expense?.currency || "inr";
    const users = dbUsers.map(
      (u) =>
        new User(
          u.id,
          getInitials(
            currUserId === u.id ? "You" : u.name || u.firstName || "-",
          ),
          u.email,
          "0",
        ),
    );
    const group = new Group("Group", currency);

    users.forEach((u) => group.addUser(u));

    const N = users.length;

    const expenseRepository = new ExpenseRepository(group);
    const service = new SplitifyService(expenseRepository);

    await evaluateExpense(service, expense, payments, splits, currency);

    if (detailed) {
      return service.getBalancesList().sort((a, b) => b?.owes - a?.owes);
    } else {
      const userIdsArr = users.map((u) => u.userId);
      const userNamesArr = users.map((u) => u.userName);

      const minifyService = new MinifySplitsService(userNamesArr, userIdsArr);
      minifyService.execute(
        MinifySplitsService.createGraph(
          N,
          userIdsArr,
          service.getBalancesTable(),
        ),
      );

      const symbol = getCurrencySymbol(currency);

      return minifyService
        .getBalancesList(symbol)
        .sort((a, b) => b?.owes - a?.owes);
    }
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const calcGroupSplits = async (
  currUserId: string,
  expenses: ExpenseWithPaymentWithSplit[] | null,
  dbUsers: DBUser[],
  currency: string | null,
  detailed = false,
) => {
  try {
    const groupCurrency = currency || "inr";
    if (!expenses) return [];
    const users = dbUsers.map(
      (u) =>
        new User(
          u.id,
          getInitials(
            currUserId === u.id ? "You" : u.name || u.firstName || "-",
          ),
          u.email,
          "0",
        ),
    );
    const group = new Group("Group", groupCurrency);

    users.forEach((u) => group.addUser(u));

    const N = users.length;

    const expenseRepository = new ExpenseRepository(group);
    const service = new SplitifyService(expenseRepository);

    for (const expense of expenses) {
      await evaluateExpense(
        service,
        expense,
        expense?.payments,
        expense?.splits,
        groupCurrency,
      );
    }

    if (detailed) {
      return service.getBalancesList().sort((a, b) => b?.owes - a?.owes);
    } else {
      const userIdsArr = users.map((u) => u.userId);
      const userNamesArr = users.map((u) => u.userName);

      const graph = MinifySplitsService.createGraph(
        N,
        userIdsArr,
        service.getBalancesTable(),
      );

      const minifyService = new MinifySplitsService(userNamesArr, userIdsArr);
      minifyService.execute(graph);

      const symbol = getCurrencySymbol(groupCurrency);

      return minifyService
        .getBalancesList(symbol)
        .sort((a, b) => b?.owes - a?.owes);
    }
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const evaluateTotals = (
  expensesList: ExpenseWithPaymentWithSplit[] | null,
  userId?: string,
) => {
  let yours = 0;
  if (userId) {
    const expenses = expensesList?.filter((e) => e?.tag !== "SETTLEMENT");
    const totals =
      expenses
        ?.map((e) =>
          e?.payments?.reduce((total, p) => {
            if (p?.userId === userId) {
              yours += p.amount;
            }
            return p.amount + total;
          }, 0),
        )
        ?.reduce((t, x) => t + x, 0) || 0;

    return { totals, yours };
  } else {
    return { yours, totals: 0 };
  }
};
