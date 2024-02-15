import { User } from "../user/user";

export class Payment {
  private user: string;
  private amount: number;

  constructor(userId: string, amount: number) {
    this.user = userId;
    this.amount = amount;
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
