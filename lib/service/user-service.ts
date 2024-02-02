import { User } from "../model/user/user";
import { ExpenseRepository } from "../repository/expense-repository";

export class UserService {
  expenseRepository: ExpenseRepository;

  constructor(expenseRepository: ExpenseRepository) {
    this.expenseRepository = expenseRepository;
  }

  public addUser(user: User) {
    this.expenseRepository.addUser(user);
  }
  public getUser(userName: string) {
    return this.expenseRepository.getUser(userName);
  }
}
