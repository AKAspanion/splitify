import { db } from "@/lib/db";
import BalanceSummaryList from "./expense-balance-summary-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const BalanceList = dynamic(() => import("./expense-balance-list-wrapper"), {
  loading: () => (
    <div className="">
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

const Balance = async ({
  userId,
  groupId,
  expenseId,
  balance,
}: {
  userId: string | null;
  groupId: string;
  expenseId: string;
  balance: boolean;
}) => {
  const [users, payments, splits] = await db.$transaction([
    db.user.findMany({
      where: { groups: { some: { id: groupId } } },
    }),
    db.userPayment.findMany({ where: { expenseId } }),
    db.userSplit.findMany({ where: { expenseId } }),
  ]);

  return (
    <>
      <BalanceSummaryList
        userId={userId}
        payments={payments}
        splits={splits}
        users={users}
      />
      {balance ? (
        <>
          <hr />
          <BalanceList expenseId={expenseId} users={users} />
          <Link href={`/groups/${groupId}/expense/${expenseId}?balance=`}>
            <Button variant={"secondary"}>Hide balance</Button>
          </Link>
        </>
      ) : (
        <Link href={`/groups/${groupId}/expense/${expenseId}?balance=yes`}>
          <Button variant={"secondary"}>Show balance</Button>
        </Link>
      )}
    </>
  );
};

export default Balance;
