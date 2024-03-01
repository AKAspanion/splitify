import { NextResponse } from "next/server";

export async function GET(_req: Request) {
  try {
    return NextResponse.json({ message: "Blocked" }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Somethig went wrong" },
      { status: 500 },
    );
  }
}
