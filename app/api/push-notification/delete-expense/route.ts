import { db } from "@/lib/db";
import { GroupWIthUsers } from "@/types/shared";
import { getYouKeyword } from "@/utils/validate";
import { auth } from "@clerk/nextjs";
import { Expense, User } from "@prisma/client";
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
      const promises = [
        db.group.findUnique({
          where: { id: groupId },
          include: { users: true },
        }),
        db.user.findUnique({ where: { id: creatorId } }),
      ];
      const [group, user] = (await Promise.all(promises)) as [
        GroupWIthUsers,
        User,
      ];

      const notifyUsers = group.users || [];
      const notifications = notifyUsers.map((u) => ({
        heading: `Expense deleted`,
        content: `${getYouKeyword(u?.id, creatorId, user?.firstName || user?.name || "")} deleted expense ${expenseName} in group ${group?.title}`,
        external_id: [u.id],
      }));

      notifications.forEach((n) =>
        sendNotification(n).then((e) =>
          APILogger.info(`Expense deleted ${n.content}`, e),
        ),
      );

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
