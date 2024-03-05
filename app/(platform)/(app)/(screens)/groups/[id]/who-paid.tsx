import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { whoPaidExpense } from "../../../_utils/expense";

const WhoPaid = async ({
  expenseId,
  amount,
}: {
  expenseId: string;
  amount: number;
}) => {
  const { userId } = auth();
  if (!expenseId || !amount) {
    return null;
  }

  const payments = await db.userPayment.findMany({
    where: { expenseId: expenseId || "null" },
    select: { user: true },
  });

  const whoPaid = whoPaidExpense(amount, payments || [], userId || "");

  return <div>{whoPaid}</div>;
};

export default WhoPaid;
