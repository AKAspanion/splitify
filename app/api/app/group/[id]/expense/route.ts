import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { EXPENSE_PAGE_COUNT } from "@/constants/numbers";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const groupId = params.id;
    const page = Number(searchParams.get("page") || "1");
    const queryText = searchParams.get("queryText") || "";

    const skip = (page - 1) * EXPENSE_PAGE_COUNT;
    const take = page * EXPENSE_PAGE_COUNT;

    const [count, expenses] = await Promise.all([
      db.expense.count({
        where: { groupId, description: { contains: queryText } },
      }),
      db.expense.findMany({
        skip,
        take,
        where: { groupId, description: { contains: queryText } },
        orderBy: [{ createdAt: "desc" }],
      }),
    ]);

    return NextResponse.json({ count, expenses }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
