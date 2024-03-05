import { db } from "@/lib/db";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload: WebhookEvent = await request.json();
    let userIdFound = "";
    const data = payload.data as any;
    const email = data?.email_addresses?.[0];

    try {
      if (email) {
        const emailUser = await db.user.findUnique({
          where: { email: email?.email_address || "" },
        });
        if (emailUser) {
          userIdFound = emailUser?.id;
        }
      }
    } catch (error) {
      userIdFound = "";
    }

    const user = {
      id: (userIdFound || data?.id || "") as string,
      email: email?.email_address || "",
      firstName: data?.first_name || "",
      lastName: data?.last_name || "",
      name: [data?.first_name || "", data?.last_name || ""].join(" "),
      image_url: data?.image_url,
      profile_image_url: data?.profile_image_url,
    };

    switch (payload?.type) {
      case "user.created":
        if (user?.id?.startsWith("sp")) {
          await db.user.upsert({
            where: { id: user.id },
            update: { ...user },
            create: { ...user },
          });
        } else {
          await db.user.create({ data: user });
        }
        break;
      case "user.updated":
        await db.user.upsert({
          where: { id: user.id },
          update: { ...user },
          create: { ...user },
        });
        break;
      default:
        break;
    }

    return NextResponse.json({ message: "Event received" }, { status: 200 });
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { message: error?.message || "Failed to parse event" },
      { status: 400 },
    );
  }
}

export async function GET() {
  return Response.json({ message: "Hello Clerk Webhook!" });
}
