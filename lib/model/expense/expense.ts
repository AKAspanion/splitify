import { uid } from "uid";
import { User } from "../user/user";
import { ExpenseData } from "./expense-data";
import { Split } from "../split/split";

export abstract class Expense {
  id: string;
  amount: number;
  expensePaidBy: User;
  splits: Split[];
  expenseData: ExpenseData;

  constructor(
    amount: number,
    expensePaidBy: User,
    splits: Split[],
    expenseData: ExpenseData
  ) {
    this.id = uid();
    this.amount = amount;
    this.expensePaidBy = expensePaidBy;
    this.splits = splits;
    this.expenseData = expenseData;
  }

  public getId() {
    return this.id;
  }

  public getAmount() {
    return this.amount;
  }

  public setAmount(amount: number) {
    this.amount = amount;
  }

  public getExpensePaidBy() {
    return this.expensePaidBy;
  }

  public setExpensePaidBy(expensePaidBy: User) {
    this.expensePaidBy = expensePaidBy;
  }

  public getSplits() {
    return this.splits;
  }

  public setSplits(splits: Split[]) {
    this.splits = splits;
  }

  public getExpenseData() {
    return this.expenseData;
  }

  public setExpenseData(expenseData: ExpenseData) {
    this.expenseData = expenseData;
  }

  public abstract validate(): boolean;
}
