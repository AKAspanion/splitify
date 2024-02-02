import { split } from "postcss/lib/list";
import { ExpenseData } from "../model/expense/expense-data";
import { ExpenseType } from "../model/expense/expense-type";
import { Payment } from "../model/payment/payment";
import { Split } from "../model/split/split";
import { User } from "../model/user/user";
import { ExpenseRepository } from "../repository/expense-repository";
import { EqualSplit } from "../model/split/equal-split";
import { ExactSplit } from "../model/split/exact-split";
import { PercentSplit } from "../model/split/percent-split";

export class SplitWiseService {
  expenseRepository: ExpenseRepository;

  constructor(expenseRepository: ExpenseRepository) {
    this.expenseRepository = expenseRepository;
  }

  public addExpense(
    name: string,
    expenseType: ExpenseType,
    payment: Payment,
    splits: Split[]
  ) {
    if (!this.validateSplits(expenseType, splits)) {
      throw new Error(
        "Splits should be of same type as expense type " +
          expenseType.toString()
      );
    }
    this.expenseRepository.addExpense(name, expenseType, payment, splits);
  }

  private validateSplits(expenseType: ExpenseType, splits: Split[]) {
    switch (expenseType) {
      case ExpenseType.EQUAL:
        return (
          splits.map((s) => s instanceof EqualSplit).filter((f) => f === true)
            .length === splits.length
        );
      case ExpenseType.EXACT:
        return (
          splits.map((s) => s instanceof ExactSplit).filter((f) => f === true)
            .length === splits.length
        );
      case ExpenseType.PERCENT:
        return (
          splits.map((s) => s instanceof PercentSplit).filter((f) => f === true)
            .length === splits.length
        );
      default:
        return false;
    }
  }

  public getBalance(user: User): string {
    const balances = this.expenseRepository.getBalance(user.getUserId());
    if (balances.length === 0) {
      return "No balance for " + user?.getUserName();
    } else {
      return balances.join("\n");
    }
  }

  public getBalances(): string {
    const balances = this.expenseRepository.getBalances();
    if (balances.length === 0) {
      return "No balances";
    } else {
      return balances.join("\n");
    }
  }
}
