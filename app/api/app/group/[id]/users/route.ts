import { db } from "@/lib/db";
import { isGroupMember } from "@/lib/auth/membership";
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

    if (!(await isGroupMember(userId, params.id))) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const users = await db.user.findMany({
      where: { groups: { some: { id: params.id || "null" } } },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error("Group users read failed", error?.name);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
