import { db } from "@/lib/db";
import { BalancesList } from "./balances-list";
import { auth } from "@clerk/nextjs";

const Balances = async ({
  id,
  onlyList,
}: {
  id: string;
  onlyList?: boolean;
}) => {
  const { userId } = auth();

  const [expenses, group] = await db.$transaction([
    db.expense.findMany({
      where: { groupId: id },
      orderBy: [{ createdAt: "desc" }],
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

  return <BalancesList expenses={expenses} group={group} onlyList={onlyList} />;
};

export default Balances;
