import { ExpenseType } from "../model/expense/expense-type";
import { Payment } from "../model/payment/payment";
import { Split } from "../model/split/split";
import { User } from "../model/user/user";
import { ExpenseRepository } from "../repository/expense-repository";
import { EqualSplit } from "../model/split/equal-split";
import { ExactSplit } from "../model/split/exact-split";
import { PercentSplit } from "../model/split/percent-split";
import { fixedNum } from "@/utils/validate";

export class SplitifyService {
  expenseRepository: ExpenseRepository;

  constructor(expenseRepository: ExpenseRepository) {
    this.expenseRepository = expenseRepository;
  }

  public addExpense(
    name: string,
    expenseType: ExpenseType,
    payments: Payment[],
    splits: Split[],
  ) {
    if (!this.validateSplits(expenseType, splits)) {
      throw new Error(
        "Splits should be of same type as expense type " +
          expenseType.toString(),
      );
    }

    if (payments.length === 1) {
      this.expenseRepository.addExpense(name, expenseType, payments[0], splits);
      return;
    }

    switch (expenseType) {
      case ExpenseType.EQUAL:
        for (const payment of payments) {
          const totalSplits = splits.length;
          this.expenseRepository.addExpense(
            name,
            ExpenseType.PERCENT,
            payment,
            splits.map((s) => {
              const percent = fixedNum((1 / totalSplits) * 100);
              return new PercentSplit(s.getUser(), percent);
            }),
          );
        }
        break;
      case ExpenseType.PERCENT:
        for (const payment of payments) {
          this.expenseRepository.addExpense(
            name,
            expenseType,
            payment,
            splits.map(
              (s) =>
                new PercentSplit(s.getUser(), (s as PercentSplit).getPercent()),
            ),
          );
        }
        break;
      case ExpenseType.EXACT:
        let totalSplits = 0;
        let totalPayments = 0;
        for (const split of splits) {
          totalSplits += split.getAmount();
        }
        for (const payment of payments) {
          totalPayments += payment.getAmount();
        }

        if (totalSplits !== totalPayments) {
          throw new Error("Validation failed for exact total amount");
        }

        for (const payment of payments) {
          this.expenseRepository.addExpense(
            name,
            ExpenseType.PERCENT,
            payment,
            splits.map((s) => {
              const percent = fixedNum((s.getAmount() / totalPayments) * 100.0);
              return new PercentSplit(s.getUser(), percent);
            }),
          );
        }

        break;
      default:
        throw new Error("Handling for this type of expense not found");
    }
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
      return balances.join("\n ");
    }
  }

  public getBalances(): string {
    const balances = this.expenseRepository.getBalances();
    if (balances.length === 0) {
      return "No balances";
    } else {
      return balances.join("\n ");
    }
  }

  public getBalancesTable(): string[] {
    return this.expenseRepository.getBalances();
  }

  public getBalanceSheets() {
    return this.expenseRepository.getBalanceSheets();
  }
}
