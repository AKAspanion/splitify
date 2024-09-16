import { AutoContainer } from "@/components/container/auto-container";
import { auth } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatarsLoading } from "@/app/(platform)/(app)/_components/user-avatars";
import ExpenseHeader from "./expense-header";
import ExpenseClient from "./expense-client";

const Balance = dynamic(() => import("./expense-balance"), {
  loading: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-[160px]" />
        <Skeleton className="h-4 w-[60px]" />
      </div>
    </div>
  ),
});

const ExpenseAddedBy = dynamic(() => import("./expense-added-by"), {
  loading: () => <Skeleton className="h-5 w-[120px]" />,
});

const ExpenseUsers = dynamic(() => import("./expense-users"), {
  loading: () => <UserAvatarsLoading lg />,
});

const ExpenseDetails = ({ params, searchParams }: ServerSideComponentProp) => {
  const { userId } = auth();
  const groupId = params["id"] || "null";
  const expenseId = params["expenseId"] || "null";

  const showBalance = searchParams["balance"] === "yes";

  const keyString = `balance=${searchParams?.["balance"]}`;

  return (
    <AutoContainer
      header={<ExpenseHeader groupId={groupId} expenseId={expenseId} />}
    >
      <div className="flex flex-col gap-6">
        <ExpenseClient groupId={groupId} expenseId={expenseId} />
        <ExpenseAddedBy groupId={groupId} expenseId={expenseId} />
        <ExpenseUsers
          expenseId={expenseId}
          groupId={groupId}
          balance={
            <Balance
              key={keyString}
              userId={userId}
              groupId={groupId}
              expenseId={expenseId}
              balance={showBalance}
            />
          }
        />
      </div>
    </AutoContainer>
  );
};

export default ExpenseDetails;
