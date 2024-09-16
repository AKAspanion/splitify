import { User } from "../user/user";

export class Group {
  name: string;
  currency: string;
  userMap: Map<string, User>;
  balanceSheet: Map<string, Map<string, number>>;

  constructor(name: string, currency: string) {
    this.name = name;
    this.currency = currency;
    this.userMap = new Map<string, User>();
    this.balanceSheet = new Map<string, Map<string, number>>();
  }

  public addUser(user: User) {
    this.userMap.set(user.getUserId(), user);
    this.balanceSheet.set(user.getUserId(), new Map<string, number>());
  }

  public getUser(userId: string) {
    return this.userMap.get(userId);
  }

  public getBalanceSheet(userId: string) {
    return this.balanceSheet.get(userId);
  }

  public getBalanceSheets() {
    return this.balanceSheet;
  }
}
