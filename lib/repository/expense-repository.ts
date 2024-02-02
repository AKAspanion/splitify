import { Expense } from "../model/expense/expense";
import { ExpenseData } from "../model/expense/expense-data";
import { ExpenseType } from "../model/expense/expense-type";
import { Payment } from "../model/payment/payment";
import { Split } from "../model/split/split";
import { User } from "../model/user/user";
import { ExpenseService } from "../service/expense-service";

export class ExpenseRepository {
  expenses: Expense[];
  userMap: Map<string, User>;
  balanceSheet: Map<string, Map<string, number>>;

  constructor() {
    this.expenses = [];
    this.userMap = new Map<string, User>();
    this.balanceSheet = new Map<string, Map<string, number>>();
  }

  public addUser(user: User): void {
    this.userMap.set(user.getUserId(), user);
    this.balanceSheet.set(user.getUserId(), new Map<string, number>());
  }

  public getUser(userName: string): User | undefined {
    return this.userMap.get(userName);
  }

  public addExpense(
    name: string,
    expenseType: ExpenseType,
    payment: Payment,
    splits: Split[]
  ): void {
    if (this.userMap.get(payment.getUser().getUserId()) === undefined) {
      return;
    }

    const expense = ExpenseService.createExpense(
      name,
      expenseType,
      payment,
      splits
    );
    if (expense == null) {
      return;
    }
    this.expenses.push(expense);
    for (const split of expense.getSplits()) {
      const paidTo = split.getUser().getUserId();

      let balances = this.balanceSheet.get(payment.getUser().getUserId());
      if (balances) {
        if (balances?.get(paidTo) === undefined) {
          balances.set(paidTo, 0.0);
        }

        balances.set(paidTo, balances.get(paidTo)! + split.getAmount());

        balances = this.balanceSheet.get(paidTo);
        if (balances) {
          if (balances.get(payment.getUser().getUserId()) === undefined) {
            balances.set(payment.getUser().getUserId(), 0.0);
          }
          balances.set(
            payment.getUser().getUserId(),
            balances.get(payment.getUser().getUserId())! - split.getAmount()
          );
        }
      }
    }
  }

  public getBalance(userId: string) {
    const balances: string[] = [];
    this.balanceSheet.get(userId)?.forEach((userBalance, userBalanceKey) => {
      if (userBalance != 0) {
        balances.push(this.checkSign(userId, userBalanceKey, userBalance));
      }
    });
    return balances;
  }

  public getBalances(): string[] {
    const balances: string[] = [];
    this.balanceSheet.forEach((allBalances, allBalancesKey) => {
      allBalances.forEach((userBalance, userBalanceKey) => {
        if (userBalance > 0) {
          balances.push(
            this.checkSign(allBalancesKey, userBalanceKey, userBalance)
          );
        }
      });
    });
    return balances;
  }

  private checkSign(user1: string, user2: string, amount: number): string {
    const user1Name = this.userMap.get(user1)?.getUserName();
    const user2Name = this.userMap.get(user2)?.getUserName();
    if (amount < 0) {
      return user1Name + " owes " + user2Name + ": " + Math.abs(amount);
    } else if (amount > 0) {
      return user2Name + " owes " + user1Name + ": " + Math.abs(amount);
    }
    return "";
  }
}
