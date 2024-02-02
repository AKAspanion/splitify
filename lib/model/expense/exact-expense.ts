import { EqualSplit } from "../split/equal-split";
import { ExactSplit } from "../split/exact-split";
import { Split } from "../split/split";
import { User } from "../user/user";
import { Expense } from "./expense";
import { ExpenseData } from "./expense-data";

export class ExactExpense extends Expense {
  constructor(
    amount: number,
    expensePaidBy: User,
    splits: Split[],
    expenseData: ExpenseData
  ) {
    super(amount, expensePaidBy, splits, expenseData);
  }

  public validate(): boolean {
    const totalAmount = this.getAmount();
    let totalSplitAmount = 0;
    for (const split of this.getSplits()) {
      if (!(split instanceof ExactSplit)) return false;
      const exactSplit = <ExactSplit>split;
      totalSplitAmount += exactSplit.getAmount();
    }
    return totalAmount == totalSplitAmount;
  }
}
