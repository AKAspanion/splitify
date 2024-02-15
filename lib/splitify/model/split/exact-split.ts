import { User } from "../user/user";
import { Split } from "./split";

export class ExactSplit extends Split {
  constructor(user: string, amount?: number) {
    super(user, amount);
  }
}
