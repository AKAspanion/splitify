import { db } from "@/lib/db";
import { RUPPEE_SYMBOL } from "@/constants/ui";
import { TotalsList } from "./totals-list";

const Totals = async ({ id }: { id: string }) => {
  //   const { userId } = auth();
  const expenses = await db.expense.findMany({
    where: { groupId: id },
    include: {
      payments: { include: { user: true } },
      splits: { include: { user: true } },
    },
  });

  // const group = await db.group.findUnique({
  //   where: { id, users: { some: { id: userId || "null" } } },
  //   include: { users: true },
  // });

  return <TotalsList expenses={expenses} />;
};

export default Totals;
