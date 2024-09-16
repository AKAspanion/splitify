import { fixedNum, getOwsKeyword } from "@/utils/validate";
import { Expense } from "../model/expense/expense";
import { ExpenseType } from "../model/expense/expense-type";
import { Group } from "../model/group/group";
import { Payment } from "../model/payment/payment";
import { Split } from "../model/split/split";
import { User } from "../model/user/user";
import { ExpenseService } from "../service/expense-service";
import { RUPEE_SYMBOL } from "@/constants/ui";

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
      const ub = fixedNum(userBalance, 0);
      if (ub != 0) {
        balances.push(this.checkSign(userId, userBalanceKey, userBalance));
      }
    });
    return balances;
  }

  public getBalances(): FormatedBalanceResult[] {
    const balances: FormatedBalanceResult[] = [];
    this.group.getBalanceSheets().forEach((allBalances, allBalancesKey) => {
      allBalances.forEach((userBalance, userBalanceKey) => {
        const ub = fixedNum(userBalance, 0);
        if (ub > 0) {
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

  public getBalancesTable(): OweBalanceResult[] {
    const balances: OweBalanceResult[] = [];
    this.group.getBalanceSheets().forEach((allBalances, allBalancesKey) => {
      allBalances.forEach((userBalance, userBalanceKey) => {
        const ub = fixedNum(userBalance, 0);
        if (ub > 0) {
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
    const am = fixedNum(amount, 0);
    if (am < 0) {
      return `${user1Name} ${getOwsKeyword(user1Name)} ${user2Name} ${RUPEE_SYMBOL}${fixedNum(Math.abs(amount))}`;
    } else if (am > 0) {
      return `${user2Name} ${getOwsKeyword(user2Name)} ${user1Name} ${RUPEE_SYMBOL}${fixedNum(Math.abs(amount))}`;
    }
    return "";
  }

  private checkSignObj(
    user1Id: string,
    user2Id: string,
    amount: number,
  ): FormatedBalanceResult | undefined {
    const user1Name = this.getUser(user1Id)?.getUserName() || "";
    const user2Name = this.getUser(user2Id)?.getUserName() || "";
    const am = fixedNum(amount, 0);
    if (am < 0) {
      const owes = fixedNum(Math.abs(amount));
      const message = `${user1Name} ${getOwsKeyword(user1Name)} ${user2Name} ${RUPEE_SYMBOL}${owes}`;
      return {
        user1Name,
        user2Name,
        user1Id,
        user2Id,
        message,
        owes,
      };
    } else if (am > 0) {
      const owes = fixedNum(Math.abs(amount));
      const message = `${user2Name} ${getOwsKeyword(user2Name)} ${user1Name} ${RUPEE_SYMBOL}${owes}`;
      return {
        message,
        user1Name: user2Name,
        user2Name: user1Name,
        user1Id: user2Id,
        user2Id: user1Id,
        owes,
      };
    }
    return undefined;
  }

  public getBalanceSheets() {
    return this.group.getBalanceSheets();
  }
}
