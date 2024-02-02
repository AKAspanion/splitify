import { Expense } from "../model/expense/expense";
import { ExpenseType } from "../model/expense/expense-type";
import { Group } from "../model/group/group";
import { Payment } from "../model/payment/payment";
import { Split } from "../model/split/split";
import { User } from "../model/user/user";
import { ExpenseService } from "../service/expense-service";

export class ExpenseRepository {
  group: Group;
  expenses: Expense[];

  constructor(group: Group) {
    this.expenses = [];
    this.group = group;
  }

  public addUser(user: User): void {
    this.group.addUser(user);
  }

  public getUser(userId: string): User | undefined {
    return this.group.getUser(userId);
  }

  public getBalanceSheet(userId: string) {
    return this.group.getBalanceSheet(userId);
  }

  public addExpense(
    name: string,
    expenseType: ExpenseType,
    payment: Payment,
    splits: Split[]
  ): void {
    if (this.getUser(payment.getUser().getUserId()) === undefined) {
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

      let balances = this.getBalanceSheet(payment.getUser().getUserId());
      if (balances) {
        if (balances?.get(paidTo) === undefined) {
          balances.set(paidTo, 0.0);
        }

        balances.set(paidTo, balances.get(paidTo)! + split.getAmount());

        balances = this.getBalanceSheet(paidTo);
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
    this.getBalanceSheet(userId)?.forEach((userBalance, userBalanceKey) => {
      if (userBalance != 0) {
        balances.push(this.checkSign(userId, userBalanceKey, userBalance));
      }
    });
    return balances;
  }

  public getBalances(): string[] {
    const balances: string[] = [];
    this.group.getBalanceSheets().forEach((allBalances, allBalancesKey) => {
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

  private checkSign(user1Id: string, user2Id: string, amount: number): string {
    const user1Name = this.getUser(user1Id)?.getUserName();
    const user2Name = this.getUser(user2Id)?.getUserName();
    if (amount < 0) {
      return user1Name + " owes " + user2Name + ": " + Math.abs(amount);
    } else if (amount > 0) {
      return user2Name + " owes " + user1Name + ": " + Math.abs(amount);
    }
    return "";
  }
}
