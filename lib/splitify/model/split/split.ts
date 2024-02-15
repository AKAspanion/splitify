import { User } from "../user/user";

export abstract class Split {
  private user: string;
  private amount: number;

  constructor(user: string, amount = 0) {
    this.amount = amount;
    this.user = user;
  }

  public getUser(): string {
    return this.user;
  }

  public setUser(user: string): void {
    this.user = user;
  }

  public getAmount(): number {
    return this.amount || 0;
  }

  public setAmount(amount: number): void {
    this.amount = amount;
  }
}
