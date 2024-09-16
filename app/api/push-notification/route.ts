import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/onesignal";

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: SendNotificationUserbody = await req.json();
    const heading = body?.heading || "";
    const content = body?.content || "";
    const external_id = body?.external_id || [];
    const options = body?.options || {};

    const data = await sendNotification({
      heading,
      content,
      external_id,
      options,
    });

    if (data?.errors) {
      return NextResponse.json({ data: data?.errors }, { status: 400 });
    } else {
      return NextResponse.json(
        { message: "Message sent", data },
        { status: 200 },
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
