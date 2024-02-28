import { replaceUserWithYou } from "@/app/(platform)/(app)/_utils/user";
import { db } from "@/lib/db";
import { format } from "date-fns";

const ExpenseAddedBy = async ({
  userId,
  groupId,
  expenseId,
}: {
  userId: string | null;
  groupId: string;
  expenseId: string;
}) => {
  const expense = await db.expense.findUnique({
    where: { id: expenseId || "null", groupId },
    select: { user: true, createdAt: true },
  });
  const addedBy = replaceUserWithYou(
    userId,
    expense?.user?.id,
    expense?.user?.name,
  );

  const createDate = expense?.createdAt
    ? format(expense?.createdAt, "d LLLL, yyyy")
    : "";

  return (
    <div className="font-thin text-sm">
      Added by {addedBy} on {createDate}
    </div>
  );
};

export default ExpenseAddedBy;
