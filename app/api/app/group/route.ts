import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const query = {
    take: searchParams.get("show") === "true" ? undefined : 6,
    where: {
      users: { some: { id: userId || "null" } },
      title: { contains: searchParams.get("searchText") || undefined },
    },
  };

  const groups = await db.group.findMany({
    ...query,
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json(groups, { status: 200 });
}
