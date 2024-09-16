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

    const group = await db.group.findUnique({
      where: { id: params.id, users: { some: { id: userId || "null" } } },
    });

    return NextResponse.json(group, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
