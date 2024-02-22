import DevicesService from "@/lib/auth/service/devices";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET(_req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const devices = await DevicesService.getDevice(userId);

    if (!devices) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    return NextResponse.json({ data: devices }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Somethig went wrong" },
      { status: 500 },
    );
  }
}
