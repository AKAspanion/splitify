import { replaceUserWithYou } from "@/app/(platform)/(app)/_utils/user";
import { db } from "@/lib/db";
import { relativeDate } from "@/utils/date";

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
    ? new Date(expense?.createdAt).toString()
    : "";

  return (
    <div className="font-thin text-sm">
      Added by {addedBy}, {relativeDate(createDate)}
    </div>
  );
};

export default ExpenseAddedBy;
