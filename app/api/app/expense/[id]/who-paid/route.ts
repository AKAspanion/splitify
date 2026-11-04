import { whoPaidExpense } from "@/app/(platform)/(app)/_utils/expense";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const expenseId = params.id;

    const payments = await db.userPayment.findMany({
      where: { expenseId: expenseId || "null" },
      include: { user: true },
    });

    const whoPaid = whoPaidExpense(payments || [], userId);

    return NextResponse.json(whoPaid, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
