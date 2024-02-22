import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { db } from "@/lib/db";
import { Actions } from "./actions";
import { auth } from "@clerk/nextjs";
import { format } from "date-fns";
import { whoPaidExpense } from "@/app/(platform)/(app)/_utils/expense";
import { replaceUserWithYou } from "@/app/(platform)/(app)/_utils/user";
import { RUPPEE_SYMBOL } from "@/constants/ui";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatars } from "@/app/(platform)/(app)/_components/user-avatars";

const Balance = dynamic(() => import("./balance"), {
  loading: () => (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-6 mb-1">
        <Skeleton className="h-6 w-[64px]" />
        <Skeleton className="h-6 w-[108px]" />
      </div>
      <Skeleton className="h-5 w-[160px]" />
      <Skeleton className="h-5 w-[120px]" />
      <Skeleton className="h-5 w-[100px]" />
    </div>
  ),
});

const BalanceSummary = dynamic(() => import("./balance-summary"), {
  loading: () => (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-[120px]" />
      <Skeleton className="h-4 w-[160px]" />
      <Skeleton className="h-4 w-[60px]" />
    </div>
  ),
});

const ExpenseDetails = async ({ params }: ServerSideComponentProp) => {
  const { userId } = auth();
  const groupId = params["id"] || "null";
  const expenseId = params["expenseId"] || "null";

  const expense = await db.expense.findUnique({
    where: { id: expenseId, groupId },
    include: {
      User: true,
      payments: { include: { user: true } },
      splits: { include: { user: true } },
    },
  });

  const backTo = `/groups/${expense?.groupId || ""}`;

  const addedBy = replaceUserWithYou(
    userId,
    expense?.User?.id,
    expense?.User?.name,
  );

  const createDate = expense?.createdAt
    ? format(expense?.createdAt, "d LLLL, yyyy")
    : "";

  const users = expense?.payments?.map((p) => p.user) || [];

  return (
    <AutoContainer
      header={
        <Header
          backTo={backTo}
          title={expense?.description}
          actions={<Actions expense={expense} />}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <div className={""}>
          <div className="font-bold text-lg">
            {RUPPEE_SYMBOL} {expense?.amount}
          </div>
          <div className="font-thin text-sm">
            Added by {addedBy} on {createDate}
          </div>
        </div>
        {users?.length ? (
          <UserAvatars
            users={users}
            action={
              <div className="text-sm">
                {whoPaidExpense(expense?.amount, expense?.payments || [])}
              </div>
            }
          />
        ) : null}
        <BalanceSummary groupId={groupId} expense={expense} />
        <hr />
        <Balance groupId={groupId} expense={expense} />
      </div>
    </AutoContainer>
  );
};

export default ExpenseDetails;
