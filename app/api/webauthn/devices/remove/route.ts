import DevicesService from "@/lib/auth/service/devices";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(_req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const flag = await DevicesService.removeDevices(userId);

    if (flag) {
      return NextResponse.json({ message: "Devices removed" }, { status: 200 });
    } else {
      return NextResponse.json(
        { message: "Failed to remove devices" },
        { status: 400 },
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Somethig went wrong" },
      { status: 500 },
    );
  }
}
