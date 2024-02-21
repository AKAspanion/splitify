import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { postCall } from "../fetch";

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const heading = body?.heading || "";
    const content = body?.content || "";
    const external_id = body?.userIds || [];
    const target_channel = "push";

    const notificationBody = {
      target_channel,
      contents: { en: content },
      headings: { en: heading },
      include_aliases: { external_id },
    };

    const data = await postCall("/notifications", notificationBody);
    const res = await data.json();

    if (res?.errors) {
      return NextResponse.json({ data: res?.errors }, { status: 400 });
    } else {
      return NextResponse.json({ data: "Message sent" }, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Somethig went wrong" },
      { status: 500 },
    );
  }
}
