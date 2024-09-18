import { db } from "@/lib/db";
import { TotalsList } from "./totals-list";
import { auth } from "@clerk/nextjs";

const Totals = async ({ id }: { id: string }) => {
  const { userId } = auth();
  const [expenses, group] = await db.$transaction([
    db.expense.findMany({
      where: { groupId: id },
      include: {
        payments: { include: { user: true } },
        splits: { include: { user: true } },
      },
    }),
    db.group.findUnique({
      where: { id, users: { some: { id: userId || "null" } } },
      include: { users: true },
    }),
  ]);

  return <TotalsList group={group} expenses={expenses} />;
};

export default Totals;
