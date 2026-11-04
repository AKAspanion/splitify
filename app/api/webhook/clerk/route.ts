import { db } from "@/lib/db";
import { anonymiseUser } from "@/lib/account/anonymise";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let payload: WebhookEvent;
  try {
    // Checks the Svix signature against CLERK_WEBHOOK_SIGNING_SECRET before anything in the body is read.
    payload = await verifyWebhook(request);
  } catch (error) {
    console.error(
      "Clerk webhook signature check failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  try {
    if (payload?.type === "user.deleted") {
      // A deleted event carries only the id, so it skips the email lookup below.
      const deletedId = payload.data?.id;
      if (deletedId) {
        await db.$transaction((tx) => anonymiseUser(tx, deletedId));
      }
      return NextResponse.json({ message: "Event received" }, { status: 200 });
    }

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
      fromClerk: true,
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
  } catch (error) {
    console.error(
      "Clerk webhook handling failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({ message: "Hello Clerk Webhook!" });
}
