import { yourShareInExpense } from "@/app/(platform)/(app)/_utils/expense";
import { db } from "@/lib/db";
import { getCurrencySymbol } from "@/utils/currency";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string; expenseId: string } },
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const currency = searchParams.get("currency") || "inr";

    const groupId = params.id;
    const expenseId = params.expenseId;

    const [users, payments, splits] = await db.$transaction([
      db.user.findMany({
        where: { groups: { some: { id: groupId || "null" } } },
      }),
      db.userPayment.findMany({ where: { expenseId } }),
      db.userSplit.findMany({ where: { expenseId } }),
    ]);

    const yourShare = yourShareInExpense(
      userId,
      users,
      payments,
      splits,
      currency,
    );

    return NextResponse.json(yourShare, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
