import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/onesignal";
import { Group, User } from "@prisma/client";
import { db } from "@/lib/db";
import { APILogger } from "@/lib/logger";

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
      const notifications = [
        sendNotification({
          heading,
          content: `You have added ${friend?.firstName || friend?.name || "Someone"} as your friend`,
          external_id: [creator?.id],
          options: { url: `/friends` },
        }),
        sendNotification({
          heading,
          content: `${creator?.firstName || creator?.name || "Someone"} added you as your friend}`,
          external_id: [friend?.id],
          options: { url: `/friends` },
        }),
      ];

      const data = await Promise.allSettled(notifications);

      data.forEach(
        async (n) => await APILogger.info(`New friendship ${n.status}`, n),
      );

      return NextResponse.json(
        { message: "Messages processed", data },
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
