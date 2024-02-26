import { ExpenseCard } from "@/app/(platform)/(app)/_components/expense-card";
import { NoData } from "@/components/no-data";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

const ExpensesList = async ({ id }: { id: string }) => {
  const { userId } = auth();
  const expenses = await db.expense.findMany({
    where: { groupId: id },
    orderBy: [{ createdAt: "desc" }],
    include: { payments: { include: { user: true } } },
  });

  const noExpenses = !expenses || expenses?.length == 0;
  return (
    <>
      {noExpenses ? (
        <NoData
          title="No expenses here yet."
          subtitle="Go ahead and add some expenses."
        />
      ) : (
        <>
          <div className="pb-8 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenses?.map((e) => (
              <ExpenseCard currUserId={userId || ""} expense={e} key={e.id} />
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default ExpensesList;
