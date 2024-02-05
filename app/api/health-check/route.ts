import { ExpenseType } from "@/lib/model/expense/expense-type";
import { Group } from "@/lib/model/group/group";
import { Payment } from "@/lib/model/payment/payment";
import { EqualSplit } from "@/lib/model/split/equal-split";
import { ExactSplit } from "@/lib/model/split/exact-split";
import { PercentSplit } from "@/lib/model/split/percent-split";
import { User } from "@/lib/model/user/user";
import { ExpenseRepository } from "@/lib/repository/expense-repository";
import { SplitWiseService } from "@/lib/service/splitwise-service";
import { NextResponse } from "next/server";

export async function GET(_req: Request) {
  try {
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
