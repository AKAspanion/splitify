import { uid } from "uid";
import { User } from "../user/user";
import { Split } from "../split/split";
import { Payment } from "../payment/payment";

export abstract class Expense {
  id: string;
  payment: Payment;
  splits: Split[];
  name: string;

  constructor(name: string, payment: Payment, splits: Split[]) {
    this.name = name;
    this.id = uid();
    this.payment = payment;
    this.splits = splits;
  }

  public getId() {
    return this.id;
  }

  public getAmount() {
    return this.payment.getAmount();
  }

  public setAmount(amount: number) {
    this.payment.setAmount(amount);
  }

  public getExpensePaidBy() {
    return this.payment.getUser();
  }

  public setExpensePaidBy(expensePaidBy: User) {
    return this.payment.setUser(expensePaidBy);
  }

  public getSplits() {
    return this.splits;
  }

  public setSplits(splits: Split[]) {
    this.splits = splits;
  }

  // public getExpenseData() {
  //   return this.expenseData;
  // }

  // public setExpenseData(expenseData: ExpenseData) {
  //   this.expenseData = expenseData;
  // }

  public abstract validate(): boolean;
}
