import { EqualSplit } from "../split/equal-split";
import { ExactSplit } from "../split/exact-split";
import { PercentSplit } from "../split/percent-split";
import { Split } from "../split/split";
import { User } from "../user/user";
import { Expense } from "./expense";
import { ExpenseData } from "./expense-data";

export class PercentExpense extends Expense {
  constructor(
    amount: number,
    expensePaidBy: User,
    splits: Split[],
    expenseData: ExpenseData
  ) {
    super(amount, expensePaidBy, splits, expenseData);
  }

  public validate(): boolean {
    let totalSplitPercent = 0;

    for (const split of this.getSplits()) {
      if (!(split instanceof PercentSplit)) return false;

      const percentSplit = <PercentSplit>split;
      totalSplitPercent += percentSplit.getPercent();
    }

    return 100 == totalSplitPercent;
  }
}
