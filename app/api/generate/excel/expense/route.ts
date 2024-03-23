import { db } from "@/lib/db";
import { generateXLS } from "@/lib/excel";
import { GroupWIthExpenseWithUserWithPaymentWithSplit } from "@/types/shared";
import { auth } from "@clerk/nextjs";
import { User } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateGroupReportBody = await req.json();

    const groupId = body?.groupId;

    if (groupId) {
      const promises = [
        db.user.findMany({
          where: { groups: { some: { id: groupId } } },
        }),
        db.group.findUnique({
          where: { id: groupId },
          include: { expenses: { include: { payments: true, splits: true } } },
        }),
      ];
      const [users, group] = (await Promise.all(promises)) as [
        User[],
        GroupWIthExpenseWithUserWithPaymentWithSplit,
      ];

      const expenses = group?.expenses;
      if (expenses.length > 0) {
        const parsedExpenses: any[] = [];
        expenses?.forEach((exp) => {
          parsedExpenses.push(exp);
          users?.forEach((u) => {
            const paid =
              exp?.payments?.find((p) => p.userId === u.id)?.amount || 0;
            const owed =
              exp?.splits?.find((s) => s.userId === u.id)?.amount || 0;

            const name = u?.name || u?.firstName;

            if (!paid && !owed) {
              return null;
            }

            parsedExpenses.push({ name, paid, owed });
          });
        });
        const xlsBuffer = await generateXLS(
          group.title || "Group",
          [
            { header: "Description", key: "description", width: 40 },
            { header: "Amount", key: "amount", width: 15 },
            { header: "Category", key: "category", width: 15 },
            { header: "Type", key: "type", width: 15 },
            { header: "Name", key: "name", width: 20 },
            { header: "Paid", key: "paid", width: 15 },
            { header: "Owed", key: "owed", width: 15 },
          ],
          parsedExpenses,
        );
        return new NextResponse(xlsBuffer, {
          status: 200,
          headers: new Headers({
            "content-disposition": `attachment;filename=${group.title}.xlsx`,
            "content-type": "application/vnd.ms-excel",
          }),
        });
      }
      return NextResponse.json(
        { message: "No expenses found" },
        { status: 404 },
      );
    } else {
      return NextResponse.json(
        { message: "Cannot process report generation" },
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
