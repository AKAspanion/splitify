import { Payment } from "../payment/payment";
import { EqualSplit } from "../split/equal-split";
import { Split } from "../split/split";
import { Expense } from "./expense";

export class EqualExpense extends Expense {
  constructor(
    name: string,
    currency: string,
    payment: Payment,
    splits: Split[],
  ) {
    super(name, currency, payment, splits);
  }

  public validate(): boolean {
    for (const split of this.getSplits()) {
      if (!(split instanceof EqualSplit)) return false;
    }
    return true;
  }
}
