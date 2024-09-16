import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const expenseId = params.id;

    const payments = await db.userPayment.findMany({
      where: { expenseId: expenseId || "null" },
      include: { user: true },
    });

    return NextResponse.json({ payments }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
