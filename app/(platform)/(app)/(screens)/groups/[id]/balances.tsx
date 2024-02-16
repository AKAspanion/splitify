import { db } from "@/lib/db";
import { BalancesList } from "./balances-list";
import { auth } from "@clerk/nextjs";

const Balances = async ({ id }: { id: string }) => {
  const { userId } = auth();
  const expenses = await db.expense.findMany({
    where: { groupId: id },
    include: {
      User: true,
      Group: true,
      payments: { include: { user: true } },
      splits: { include: { user: true } },
    },
  });

  const group = await db.group.findUnique({
    where: { id, users: { some: { id: userId || "null" } } },
    include: { users: true },
  });

  return <BalancesList expenses={expenses} group={group} />;
};

export default Balances;
