import { ExpenseType } from "@/lib/splitify/model/expense/expense-type";
import { Group } from "@/lib/splitify/model/group/group";
import { Payment } from "@/lib/splitify/model/payment/payment";
import { EqualSplit } from "@/lib/splitify/model/split/equal-split";
import { ExactSplit } from "@/lib/splitify/model/split/exact-split";
import { PercentSplit } from "@/lib/splitify/model/split/percent-split";
import { User } from "@/lib/splitify/model/user/user";
import { ExpenseRepository } from "@/lib/splitify/repository/expense-repository";
import { SplitifyService } from "@/lib/splitify/service/splitify-service";
import { NextResponse } from "next/server";

export async function GET(_req: Request) {
  try {
    const ankit = new User("1", "ankit", "u1@gmail.com", "9890098900");
    // const komal = new User("2", "komal", "u2@gmail.com", "9999999999");
    const akash = new User("3", "akash", "u3@gmail.com", "9898989899");
    const aloke = new User("4", "aloke", "u4@gmail.com", "8976478292");

    const group = new Group("Split");
    group.addUser(ankit);
    // group.addUser(komal);
    group.addUser(akash);
    group.addUser(aloke);

    // Adding Expenses
    const expenseRepository = new ExpenseRepository(group);
    const service = new SplitifyService(expenseRepository);

    console.log(service.getBalances());
    console.log("-----------------");
    service.addExpense(
      "GoaFlight",
      ExpenseType.EXACT,
      [new Payment("4", 500)],
      [
        new ExactSplit("1", 100),
        new ExactSplit("4", 150),
        new ExactSplit("3", 250),
      ],
    );
    service.addExpense(
      "GoaFlight",
      ExpenseType.EXACT,
      [new Payment("3", 1000)],
      // [new Payment("3", 1000), new Payment("4", 500)],
      [
        new ExactSplit("1", 200),
        new ExactSplit("4", 300),
        new ExactSplit("3", 500),
      ],
    );
    service.addExpense(
      "GoaFlight",
      ExpenseType.EXACT,
      [new Payment("3", 1000), new Payment("4", 500)],
      [
        new ExactSplit("1", 300),
        new ExactSplit("4", 450),
        new ExactSplit("3", 750),
      ],
    );
    // service.addExpense(
    //   "GoaFlight",
    //   ExpenseType.PERCENT,
    //   [new Payment("3", 1000), new Payment("4", 500)],
    //   [
    //     new PercentSplit("1", 30),
    //     new PercentSplit("4", 20),
    //     new PercentSplit("3", 50),
    //   ]
    // );
    // service.addExpense(
    //   "GoaFlight",
    //   ExpenseType.EXACT,
    //   [new Payment("3", 1000), new Payment("4", 500)],
    //   // [new Payment("1", 1500)],
    //   [
    //     new ExactSplit("1", 450),
    //     new ExactSplit("4", 750),
    //     new ExactSplit("3", 300),
    //   ]
    // );

    return NextResponse.json(
      { message: service.getBalances() },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Somethig went wrong" },
      { status: 500 },
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
