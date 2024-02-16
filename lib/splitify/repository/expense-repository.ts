import { fixedNum } from "@/utils/validate";
import { Expense } from "../model/expense/expense";
import { ExpenseType } from "../model/expense/expense-type";
import { Group } from "../model/group/group";
import { Payment } from "../model/payment/payment";
import { Split } from "../model/split/split";
import { User } from "../model/user/user";
import { ExpenseService } from "../service/expense-service";
import { RUPPEE_SYMBOL } from "@/constants/ui";

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
    splits: Split[],
  ): void {
    if (this.getUser(payment.getUser()) === undefined) {
      return;
    }

    const expense = ExpenseService.createExpense(
      name,
      expenseType,
      payment,
      splits,
    );
    if (expense == null) {
      return;
    }
    this.expenses.push(expense);
    for (const split of expense.getSplits()) {
      const paidTo = split.getUser();

      let balances = this.getBalanceSheet(payment.getUser());
      if (balances) {
        if (balances?.get(paidTo) === undefined) {
          balances.set(paidTo, 0.0);
        }

        balances.set(paidTo, balances.get(paidTo)! + split.getAmount());

        balances = this.getBalanceSheet(paidTo);
        if (balances) {
          if (balances.get(payment.getUser()) === undefined) {
            balances.set(payment.getUser(), 0.0);
          }
          balances.set(
            payment.getUser(),
            balances.get(payment.getUser())! - split.getAmount(),
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
            this.checkSign(allBalancesKey, userBalanceKey, userBalance),
          );
        }
      });
    });
    return balances;
  }

  public getBalancesTable(): OweBalanceResult[] {
    const balances: OweBalanceResult[] = [];
    this.group.getBalanceSheets().forEach((allBalances, allBalancesKey) => {
      allBalances.forEach((userBalance, userBalanceKey) => {
        if (userBalance > 0) {
          const b = this.checkSignObj(
            allBalancesKey,
            userBalanceKey,
            userBalance,
          );
          if (b) {
            balances.push(b);
          }
        }
      });
    });
    return balances;
  }

  private checkSign(user1Id: string, user2Id: string, amount: number): string {
    const user1Name = this.getUser(user1Id)?.getUserName();
    const user2Name = this.getUser(user2Id)?.getUserName();
    if (amount < 0) {
      return `${user1Name} owes ${user2Name} ${RUPPEE_SYMBOL}${fixedNum(Math.abs(amount))}`;
    } else if (amount > 0) {
      return `${user2Name} owes ${user1Name} ${RUPPEE_SYMBOL}${fixedNum(Math.abs(amount))}`;
    }
    return "";
  }

  private checkSignObj(
    user1Id: string,
    user2Id: string,
    amount: number,
  ): OweBalanceResult | undefined {
    const user1Name = this.getUser(user1Id)?.getUserName() || "";
    const user2Name = this.getUser(user2Id)?.getUserName() || "";
    if (amount < 0) {
      return {
        user1Name,
        user2Name,
        user1Id,
        user2Id,
        owes: Math.abs(amount),
      };
    } else if (amount > 0) {
      return {
        user1Name: user2Name,
        user2Name: user1Name,
        user1Id: user2Id,
        user2Id: user1Id,
        owes: Math.abs(amount),
      };
    }
    return undefined;
  }

  public getBalanceSheets() {
    return this.group.getBalanceSheets();
  }
}
