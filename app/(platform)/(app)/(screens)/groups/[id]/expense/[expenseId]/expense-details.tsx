import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { RUPPEE_SYMBOL } from "@/constants/ui";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatarsLoading } from "@/app/(platform)/(app)/_components/user-avatars";

const Balance = dynamic(() => import("./expense-balance"), {
  loading: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-[160px]" />
        <Skeleton className="h-4 w-[60px]" />
      </div>
      <hr />
      <div className="flex flex-col gap-2">
        <div className="flex justify-between gap-6 mb-1">
          <Skeleton className="h-6 w-[64px]" />
          <Skeleton className="h-6 w-[108px]" />
        </div>
        <Skeleton className="h-5 w-[160px]" />
        <Skeleton className="h-5 w-[120px]" />
        <Skeleton className="h-5 w-[100px]" />
      </div>
    </div>
  ),
});

const ExpenseAddedBy = dynamic(() => import("./expense-added-by"), {
  loading: () => <Skeleton className="h-5 w-[120px]" />,
});

const ExpenseActions = dynamic(() => import("./expense-actions"), {
  loading: () => (
    <div className="flex justify-between gap-4">
      <Skeleton className="w-10 h-10 rounded-md" />
      <Skeleton className="w-10 h-10 rounded-md" />
    </div>
  ),
});

const ExpenseUsers = dynamic(() => import("./expense-users"), {
  loading: () => <UserAvatarsLoading lg />,
});

const ExpenseDetails = async ({ params }: ServerSideComponentProp) => {
  const { userId } = auth();
  const groupId = params["id"] || "null";
  const expenseId = params["expenseId"] || "null";

  const expense = await db.expense.findUnique({
    where: { id: expenseId, groupId },
  });

  const backTo = `/groups/${expense?.groupId || ""}`;

  return (
    <AutoContainer
      header={
        <Header
          backTo={backTo}
          title={expense?.description}
          actions={<ExpenseActions expense={expense} />}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <div className={""}>
          <div className="font-bold text-lg">
            {RUPPEE_SYMBOL} {expense?.amount}
          </div>
          <ExpenseAddedBy
            userId={userId}
            groupId={groupId}
            expenseId={expenseId}
          />
        </div>
        <ExpenseUsers groupId={groupId} expenseId={expenseId} />
        <Balance userId={userId} groupId={groupId} expenseId={expenseId} />
      </div>
    </AutoContainer>
  );
};

export default ExpenseDetails;
