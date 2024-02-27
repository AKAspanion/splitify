import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/onesignal";
import { db } from "@/lib/db";
import { APILogger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: DeleteGroupNotificationBody = await req.json();
    const creatorId = body?.userId;
    const groupId = body?.groupId;
    const groupName = body?.groupName;

    if (creatorId && groupName) {
      const [creator] = await db.$transaction([
        db.user.findUnique({ where: { id: creatorId } }),
      ]);
      const heading = "Deleted group";
      const notifications = [
        sendNotification({
          heading,
          content: `You deleted group ${groupName || ""}`,
          external_id: [creator?.id || ""],
          options: { url: `/groups` },
        }),
        db.activity.create({
          data: {
            groupId,
            type: "GROUP_MINUS",
            users: { connect: [{ id: creatorId }] },
            message: `${creator?.name || creator?.firstName || "Someone"} deleted group ${groupName || ""}`,
          },
        }),
      ];

      const data = await Promise.allSettled(notifications);

      data.forEach(
        async (n) => await APILogger.info(`Update Group ${n.status}`, n),
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
