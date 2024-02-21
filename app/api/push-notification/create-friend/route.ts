import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/onesignal";
import { Group, User } from "@prisma/client";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateGroupMemberNotificationBody = await req.json();
    const creatorId = body?.userId;
    const friendId = body?.friendId;

    if (creatorId && friendId) {
      const promises = [
        db.user.findUnique({ where: { id: friendId } }),
        db.user.findUnique({ where: { id: creatorId } }),
      ];
      const [friend, creator] = (await Promise.all(promises)) as [User, User];
      const heading = "New friendship";
      sendNotification({
        heading,
        content: `You have added ${friend?.firstName || friend?.name || "Someone"} as your friend`,
        external_id: [creator?.id],
      });
      sendNotification({
        heading,
        content: `${creator?.firstName || creator?.name || "Someone"} added you as your friend}`,
        external_id: [friend?.id],
      });

      return NextResponse.json(
        { message: "Messages processed" },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { message: "Cannot process messages" },
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