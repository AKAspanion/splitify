import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // const body = req.json()
    return NextResponse.json({ message: "Server is up" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Somethig went wrong" },
      { status: 500 },
    );
  }
}
