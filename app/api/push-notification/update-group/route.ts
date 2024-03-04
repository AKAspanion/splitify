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

    const body: UpdateGroupNotificationBody = await req.json();
    const updaterId = body?.userId;
    const groupId = body?.groupId;

    if (updaterId && groupId) {
      const [group, updator] = await db.$transaction([
        db.group.findUnique({ where: { id: groupId } }),
        db.user.findUnique({ where: { id: updaterId } }),
      ]);
      const heading = "Updated group";
      const notifications = [
        sendNotification({
          heading,
          content: `You updated group ${group?.title || ""}`,
          external_id: [updator?.id || ""],
          options: { url: `/groups/${groupId}` },
        }),
        db.activity.create({
          data: {
            groupId,
            type: "GROUP_UPDATE",
            users: { connect: [{ id: updaterId }] },
            message: `${updator?.firstName || updator?.name || "Someone"} updated group ${group?.title || ""}`,
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
