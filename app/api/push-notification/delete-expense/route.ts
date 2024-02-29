import { db } from "@/lib/db";
import { getYouKeyword } from "@/utils/validate";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/onesignal";
import { APILogger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: DeleteExpenseNotificationBody = await req.json();

    const groupId = body?.groupId;
    const creatorId = body?.userId;
    const expenseName = body?.expenseDesc;

    if (creatorId && groupId && expenseName) {
      const [group, creator] = await db.$transaction([
        db.group.findUnique({
          where: { id: groupId },
          include: { users: true },
        }),
        db.user.findUnique({ where: { id: creatorId } }),
      ]);

      const notifyUsers = group?.users || [];
      const notifications = notifyUsers?.map((u) =>
        sendNotification({
          heading: `Expense deleted`,
          content: `${getYouKeyword(u?.id, creatorId, creator?.firstName || creator?.name || "")} deleted expense ${expenseName} in group ${group?.title}`,
          external_id: [u.id],
          options: { url: `/groups/${groupId}` },
        }),
      );
      const activities = [
        db.activity.create({
          data: {
            groupId,
            type: "EXPENSE_MINUS",
            users: { connect: [{ id: creatorId }] },
            message: `${creator?.firstName || creator?.name || "Someone"} deleted expense ${expenseName} in group ${group?.title}`,
          },
        }),
      ];

      const data = await Promise.allSettled([...notifications, ...activities]);

      data.forEach(
        async (n) => await APILogger.info(`Expense deleted ${n.status}`, n),
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
