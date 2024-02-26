import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { Expense } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateExpenseReportBody = await req.json();

    const expenseId = body?.expenseId;

    if (expenseId) {
      const promises = [db.expense.findUnique({ where: { id: expenseId } })];
      const [group] = (await Promise.all(promises)) as [Expense];
      return NextResponse.json({ message: "Server is up" }, { status: 200 });
    } else {
      return NextResponse.json(
        { message: "Cannot process report generation" },
        { status: 400 },
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Somethig went wrong" },
      { status: 500 },
    );
  }
}
