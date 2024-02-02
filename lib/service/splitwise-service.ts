import { ExpenseData } from "../model/expense/expense-data";
import { ExpenseType } from "../model/expense/expense-type";
import { Split } from "../model/split/split";
import { User } from "../model/user/user";
import { ExpenseRepository } from "../repository/expense-repository";

export class SplitWiseService {
  expenseRepository: ExpenseRepository;

  constructor(expenseRepository: ExpenseRepository) {
    this.expenseRepository = expenseRepository;
  }

  public addExpense(
    expenseType: ExpenseType,
    amount: number,
    paidBy: User,
    splits: Split[],
    expenseData: ExpenseData
  ) {
    this.expenseRepository.addExpense(
      expenseType,
      amount,
      paidBy,
      splits,
      expenseData
    );
  }

  public getBalance(user: User): string {
    const balances = this.expenseRepository.getBalance(user.getUserId());
    if (balances.length === 0) {
      return "No balances";
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
