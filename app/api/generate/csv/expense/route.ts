import { db } from "@/lib/db";
import { isGroupMember } from "@/lib/auth/membership";
import { generateXLS } from "@/lib/excel";
import { GroupWIthExpenses, GroupWIthUsers } from "@/types/shared";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateGroupReportBody = await req.json();

    const groupId = body?.groupId;

    if (groupId) {
      if (!(await isGroupMember(userId, groupId))) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
      }
      const promises = [
        db.group.findUnique({
          where: { id: groupId },
          include: { expenses: true },
        }),
      ];
      const [group] = (await Promise.all(promises)) as [GroupWIthExpenses];

      const expenses = group.expenses;
      if (expenses.length > 0) {
        const xlsBuffer = await generateXLS(
          `Group 1`,
          [
            { header: "Description", key: "description", width: 25 },
            { header: "Amount", key: "amount", width: 15 },
            { header: "Category", key: "category", width: 15 },
            { header: "Type", key: "type", width: 15 },
          ],
          expenses,
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
    console.error("csv expense export failed", error?.name);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
