import { EqualSplit } from "../split/equal-split";
import { Split } from "../split/split";
import { User } from "../user/user";
import { Expense } from "./expense";
import { ExpenseData } from "./expense-data";

export class EqualExpense extends Expense {
  constructor(
    amount: number,
    expensePaidBy: User,
    splits: Split[],
    expenseData: ExpenseData
  ) {
    super(amount, expensePaidBy, splits, expenseData);
  }

  public validate(): boolean {
    for (const split of this.getSplits()) {
      if (!(split instanceof EqualSplit)) return false;
    }
    return true;
  }
}
