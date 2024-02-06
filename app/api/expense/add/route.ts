import { NextResponse } from "next/server";
import type { NextApiRequest, NextApiResponse } from "next";

export async function POST(_req: NextApiRequest, res: NextApiResponse) {
  try {
    return NextResponse.json({ message: "Server is up" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Somethig went wrong" },
      { status: 500 }
    );
  }
}
