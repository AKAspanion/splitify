import { User } from "../user/user";

export abstract class Split {
  private user: User;
  amount?: number;

  constructor(user: User) {
    this.user = user;
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
