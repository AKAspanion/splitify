import { db } from "@/lib/db";
import { RUPEE_SYMBOL } from "@/constants/ui";
import { TotalsList } from "./totals-list";

const Totals = async ({ id }: { id: string }) => {
  const expenses = await db.expense.findMany({
    where: { groupId: id },
    include: {
      payments: { include: { user: true } },
      splits: { include: { user: true } },
    },
  });

  return <TotalsList expenses={expenses} />;
};

export default Totals;
