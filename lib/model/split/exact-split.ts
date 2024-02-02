import { User } from "../user/user";
import { Split } from "./split";

export class ExactSplit extends Split {
  constructor(user: User, amount: number) {
    super(user);
    this.amount = amount;
  }
}
