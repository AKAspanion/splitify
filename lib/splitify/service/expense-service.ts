import { EqualExpense } from "../model/expense/equal-expense";
import { ExactExpense } from "../model/expense/exact-expense";
import { ExpenseType } from "../model/expense/expense-type";
import { PercentExpense } from "../model/expense/percent-expense";
import { Payment } from "../model/payment/payment";
import { PercentSplit } from "../model/split/percent-split";
import { Split } from "../model/split/split";

export class ExpenseService {
  public static createExpense(
    name: string,
    expenseType: ExpenseType,
    payment: Payment,
    splits: Split[],
  ) {
    switch (expenseType) {
      case ExpenseType.EXACT: {
        const exp = new ExactExpense(name, payment, splits);
        if (exp.validate()) {
          return exp;
        } else {
          throw new Error("Exact type expense validation failed");
        }
      }
      case ExpenseType.PERCENT: {
        for (const split of splits) {
          const percentSplit = <PercentSplit>split;
          const splitAmount =
            (payment.getAmount() * percentSplit?.getPercent()) / 100.0;
          split.setAmount(splitAmount);
        }
        const exp = new PercentExpense(name, payment, splits);
        if (exp.validate()) {
          return exp;
        } else {
          throw new Error("Percent type expense validation failed");
        }
      }
      case ExpenseType.EQUAL: {
        const totalSplits = splits.length;
        const splitAmount =
          Number(Math.round((payment.getAmount() * 100) / totalSplits)) / 100.0;
        for (const split of splits) {
          split.setAmount(splitAmount);
        }
        const exp = new EqualExpense(name, payment, splits);
        if (exp.validate()) {
          return exp;
        } else {
          throw new Error("Equal type expense validation failed");
        }
      }
      default:
        throw new Error("Type of expense not found");
    }
  }
}
