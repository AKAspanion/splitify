import { db } from "@/lib/db";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload: WebhookEvent = await request.json();
    console.log(payload);
    console.log((payload.data as any).email_addresses);

    switch (payload?.type) {
      case "user.created":
        // db.
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
