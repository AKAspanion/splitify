import { Payment } from "../payment/payment";
import { ExactSplit } from "../split/exact-split";
import { Split } from "../split/split";
import { Expense } from "./expense";

export class ExactExpense extends Expense {
  constructor(name: string, payment: Payment, splits: Split[]) {
    super(name, payment, splits);
  }

  public validate(): boolean {
    const totalAmount = this.getAmount();
    let totalSplitAmount = 0;
    for (const split of this.getSplits()) {
      if (!(split instanceof ExactSplit)) return false;
      const exactSplit = <ExactSplit>split;
      totalSplitAmount += exactSplit.getAmount();
    }
    return Math.round(totalAmount) == Math.round(totalSplitAmount);
  }
}
