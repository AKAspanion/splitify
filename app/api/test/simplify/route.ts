import { MinifySplitsService } from "@/lib/splitify/service/minify-splits-service";
import { NextResponse } from "next/server";

export async function GET(_req: Request) {
  try {
    const minify = new MinifySplitsService(["Ankit", "Akash", "Komal"]);
    minify.execute([
      [0, 166.67, 333.33], //a
      [0, 0, 166.67], //p
      [0, 0, 0], // k
    ]);
    return NextResponse.json(
      { data: minify.getBalancesList() },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Somethig went wrong" },
      { status: 500 },
    );
  }
}
