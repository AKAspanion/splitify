import { db } from "@/lib/db";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload: WebhookEvent = await request.json();
    const data = payload.data as any;
    const email = data?.email_addresses?.[0];
    const user = {
      clerk_id: data?.id || "",
      email: email?.email_address || "",
      name: [data?.first_name || "", data?.last_name || ""].join(" "),
      image_url: data?.image_url,
      profile_image_url: data?.profile_image_url,
    };
    switch (payload?.type) {
      case "user.created":
        await db.user.create({ data: user });
        break;
      case "user.updated":
        await db.user.upsert({
          where: { clerk_id: user.clerk_id },
          update: { ...user },
          create: { ...user },
        });
        break;
      default:
        break;
    }

    return NextResponse.json({ message: "Event received" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to receive" },
      { status: 400 }
    );
  }
}

export async function GET() {
  return Response.json({ message: "Hello Clerk Webhook!" });
}
