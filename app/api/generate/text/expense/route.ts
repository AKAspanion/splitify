import { db } from "@/lib/db";
import { generateXLS } from "@/lib/excel";
import { GroupWIthExpenses, GroupWIthUsers } from "@/types/shared";
import { auth } from "@clerk/nextjs/server";
import { Expense } from "@/generated/prisma/browser";
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
      const promises = [
        db.group.findUnique({
          where: { id: groupId },
          include: { expenses: true },
        }),
      ];
      const [group] = (await Promise.all(promises)) as [GroupWIthExpenses];

      const expenses = group.expenses;
      if (expenses.length > 0) {
        let text = "";
        const headers: { header: string; key: keyof Expense; width: number }[] =
          [
            { header: "Description", key: "description", width: 25 },
            { header: "Amount", key: "amount", width: 15 },
            { header: "Category", key: "category", width: 15 },
            { header: "Type", key: "type", width: 15 },
          ];
        text += headers.map((h) => h.header).join(",") + "\n";
        expenses.forEach((e) => {
          text += headers?.map(({ key }) => e[key] || "").join(",") + "\n";
        });

        return new NextResponse(text, {
          status: 200,
          headers: new Headers({
            "content-disposition": `attachment;filename=${group.title}.txt`,
            "content-type": "text/plain",
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
      { message: error?.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
