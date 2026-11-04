import { db } from "@/lib/db";
import { isGroupMember } from "@/lib/auth/membership";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { EXPENSE_PAGE_COUNT } from "@/constants/numbers";

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

    if (!(await isGroupMember(userId, params.id))) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);

    const groupId = params.id;
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || EXPENSE_PAGE_COUNT);
    const queryText = searchParams.get("queryText") || "";

    const take = limit === 0 ? undefined : limit;
    const skip = (page - 1) * limit;

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
    console.error("Group expenses read failed", error?.name);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
