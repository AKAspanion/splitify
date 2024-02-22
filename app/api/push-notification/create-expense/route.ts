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

    const body: CreateExpenseNotificationBody = await req.json();

    const groupId = body?.groupId;
    const expenseId = body?.expenseId;
    const creatorId = body?.userId;

    if (creatorId && groupId && expenseId) {
      const promises = [
        db.group.findUnique({
          where: { id: groupId },
          include: { users: true },
        }),
        db.expense.findUnique({ where: { id: expenseId } }),
        db.user.findUnique({ where: { id: creatorId } }),
      ];
      const [group, exp, user] = (await Promise.all(promises)) as [
        GroupWIthUsers,
        Expense,
        User,
      ];

      const notifyUsers = group.users || [];
      const notifications = notifyUsers.map((u) =>
        sendNotification({
          heading: `Expense added`,
          content: `${getYouKeyword(u?.id, creatorId, user?.firstName || user?.name || "")} added expense ${exp?.description} in group ${group?.title}`,
          external_id: [u.id],
          options: { url: `/groups/${groupId}/expense/${expenseId}` },
        }),
      );

      const data = await Promise.allSettled(notifications);

      data.forEach(
        async (n) => await APILogger.info(`Expense added ${n.status}`, n),
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
