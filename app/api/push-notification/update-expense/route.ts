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

    const body: UpdateExpenseNotificationBody = await req.json();

    const groupId = body?.groupId;
    const expenseId = body?.expenseId;
    const updatorId = body?.userId;

    if (updatorId && groupId && expenseId) {
      const [group, exp, updator] = await db.$transaction([
        db.group.findUnique({
          where: { id: groupId },
          include: { users: true },
        }),
        db.expense.findUnique({ where: { id: expenseId } }),
        db.user.findUnique({ where: { id: updatorId } }),
      ]);

      const notifyUsers = group?.users || [];
      const notifications = notifyUsers?.map((u) =>
        sendNotification({
          heading: "Expense updated",
          content: `${getYouKeyword(u?.id, updatorId, updator?.firstName || updator?.name || "")} updated expense "${exp?.description}" in group "${group?.title}"`,
          external_id: [u.id],
          options: { url: `/groups/${groupId}/expense/${expenseId}` },
        }),
      );

      const activities = [
        db.activity.create({
          data: {
            groupId,
            type: "EXPENSE_UPDATE",
            users: { connect: [{ id: updatorId }] },
            message: `${updator?.firstName || updator?.name || "Someone"} updated expense "${exp?.description || ""}" in group "${group?.title || ""}"`,
          },
        }),
      ];

      const data = await Promise.allSettled([...notifications, ...activities]);

      data.forEach(
        async (n) => await APILogger.info(`Expense updated ${n.status}`, n),
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
