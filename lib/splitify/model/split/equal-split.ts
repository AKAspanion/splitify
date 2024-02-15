import { User } from "../user/user";
import { Split } from "./split";

export class EqualSplit extends Split {
  constructor(user: User, amount?: number) {
    super(user, amount);
  }
}
