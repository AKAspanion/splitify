import { yourShareInExpense } from "@/app/(platform)/(app)/_utils/expense";
import { db } from "@/lib/db";
import { isGroupMember } from "@/lib/auth/membership";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string; expenseId: string }> },
) {
  const params = await props.params;
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const groupId = params.id;
    const expenseId = params.expenseId;

    const expense = await db.expense.findFirst({
      where: { id: expenseId, groupId },
      select: { id: true },
    });
    if (!expense || !(await isGroupMember(userId, groupId))) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const [users, payments, splits] = await db.$transaction([
      db.user.findMany({
        where: { groups: { some: { id: groupId } } },
      }),
      db.userPayment.findMany({ where: { expenseId } }),
      db.userSplit.findMany({ where: { expenseId } }),
    ]);

    const yourShare = yourShareInExpense(userId, users, payments, splits);

    return NextResponse.json(yourShare, { status: 200 });
  } catch (error: any) {
    console.error("Your share read failed", error?.name);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
