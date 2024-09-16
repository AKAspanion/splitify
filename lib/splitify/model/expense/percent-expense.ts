import { Payment } from "../payment/payment";
import { PercentSplit } from "../split/percent-split";
import { Split } from "../split/split";
import { Expense } from "./expense";

export class PercentExpense extends Expense {
  constructor(
    name: string,
    currency: string,
    payment: Payment,
    splits: Split[],
  ) {
    super(name, currency, payment, splits);
  }

  public validate(): boolean {
    let totalSplitPercent = 0;

    for (const split of this.getSplits()) {
      if (!(split instanceof PercentSplit)) return false;

      const percentSplit = <PercentSplit>split;
      totalSplitPercent += percentSplit?.getPercent();
    }

    return 100 == Math.round(totalSplitPercent);
  }
}
