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

    const groupId = params.id;

    const expenses = await db.expense.findMany({
      where: { groupId },
      orderBy: [{ createdAt: "desc" }],
      select: { currency: true },
    });

    const uniqueCurrencies = new Set([...expenses.map((e) => e.currency)]);

    return NextResponse.json(Array.from(uniqueCurrencies), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
