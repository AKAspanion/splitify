import { User } from "../user/user";

export class Payment {
  private user: User;
  private amount: number;

  constructor(user: User, amount: number) {
    this.user = user;
    this.amount = amount;
  }

  public getUser(): User {
    return this.user;
  }

  public setUser(user: User): void {
    this.user = user;
  }

  public getAmount(): number {
    return this.amount || 0;
  }

  public setAmount(amount: number): void {
    this.amount = amount;
  }
}
