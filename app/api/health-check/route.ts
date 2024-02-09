import { NextResponse } from "next/server";

export async function GET(_req: Request) {
  try {
    return NextResponse.json({ message: "Server is up" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Somethig went wrong" },
      { status: 500 },
    );
  }
}
