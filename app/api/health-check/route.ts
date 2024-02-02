import { ExpenseData } from "@/lib/model/expense/expense-data";
import { ExpenseType } from "@/lib/model/expense/expense-type";
import { Group } from "@/lib/model/group/group";
import { EqualSplit } from "@/lib/model/split/equal-split";
import { ExactSplit } from "@/lib/model/split/exact-split";
import { PercentSplit } from "@/lib/model/split/percent-split";
import { User } from "@/lib/model/user/user";
import { ExpenseRepository } from "@/lib/repository/expense-repository";
import { SplitWiseService } from "@/lib/service/splitwise-service";
import { UserService } from "@/lib/service/user-service";
import { NextResponse } from "next/server";

export async function GET(_req: Request) {
  try {
    const group = new Group("Test");

    const user1 = new User("1", "ankit", "u1@gmail.com", "9890098900");
    const user2 = new User("2", "komal", "u2@gmail.com", "9999999999");
    const user3 = new User("3", "akash", "u3@gmail.com", "9898989899");
    const user4 = new User("4", "amit", "u4@gmail.com", "8976478292");

    // Adding Expenses
    const expenseRepository = new ExpenseRepository();
    const userService = new UserService(expenseRepository);
    userService.addUser(user1);
    userService.addUser(user2);
    userService.addUser(user3);
    userService.addUser(user4);
    const service = new SplitWiseService(expenseRepository);

    console.log(service.getBalances());
    console.log(service.getBalance(user1));
    console.log("-----------------");
    service.addExpense(
      ExpenseType.EQUAL,
      1000,
      user1,
      [
        new EqualSplit(user1),
        new EqualSplit(user2),
        new EqualSplit(user3),
        new EqualSplit(user4),
      ],
      new ExpenseData("GoaFlight")
    );

    console.log(service.getBalance(user1));
    console.log(service.getBalance(user4));
    console.log("-----------------");
    service.addExpense(
      ExpenseType.EXACT,
      1250,
      user1,
      [new ExactSplit(user2, 320), new ExactSplit(user3, 880)],
      new ExpenseData("GoaFlight")
    );

    console.log(service.getBalances());
    console.log("-----------------");

    service.addExpense(
      ExpenseType.PERCENT,
      1200,
      user4,
      [
        new PercentSplit(user1, 40),
        new PercentSplit(user2, 20),
        new PercentSplit(user3, 20),
        new PercentSplit(user4, 20),
      ],
      new ExpenseData("GoaFlight")
    );
    console.log(service.getBalances());
    return NextResponse.json({ message: "Server is up" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Somethig went wrong" },
      { status: 500 }
    );
  }
}

// SHOW u1
// EXPENSE u1 1000 4 u1 u2 u3 u4 EQUAL
// SHOW u4
// SHOW u1
// EXPENSE U1 1250 2 U2 U3 EXACT 370 880
// SHOW
// EXPENSE u4 1200 4 u1 u2 u3 u4 PERCENT 40 20 20 20
// SHOW u1
// SHOW
