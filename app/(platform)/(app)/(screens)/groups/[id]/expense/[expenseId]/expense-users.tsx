import { UserAvatars } from "@/app/(platform)/(app)/_components/user-avatars";
import { whoPaidExpense } from "@/app/(platform)/(app)/_utils/expense";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

const ExpenseUsers = async ({
  amount,
  expenseId,
}: {
  amount?: number;
  expenseId: string;
}) => {
  const { userId } = auth();
  const payments = await db.userPayment.findMany({
    where: { expenseId },
    include: { user: true },
  });
  const users = payments?.map((p) => p.user) || [];

  return (
    <UserAvatars
      users={users}
      action={
        amount ? (
          <div className="text-sm">
            {whoPaidExpense(amount, payments || [], userId || "")}
          </div>
        ) : (
          ""
        )
      }
    />
  );
};

export default ExpenseUsers;
