import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { UISpinner } from "@/components/ui-spinner";
import { db } from "@/lib/db";
import { Actions } from "./actions";
import { auth } from "@clerk/nextjs";
import { format } from "date-fns";
import { whoPaidExpense } from "@/app/(platform)/(app)/_utils/expense";
import { replaceUserWithYou } from "@/app/(platform)/(app)/_utils/user";
import { RUPPEE_SYMBOL } from "@/constants/ui";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const Balance = dynamic(() => import("./balance"), {
  loading: () => (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-9 w-[100px]" />
      <Skeleton className="h-5 w-[160px]" />
      <Skeleton className="h-5 w-[120px]" />
      <Skeleton className="h-5 w-[100px]" />
    </div>
  ),
});

const UserAvatars = dynamic(
  () =>
    import("@/app/(platform)/(app)/_components/user-avatars").then(
      (d) => d.UserAvatars,
    ),
  {
    loading: () => (
      <div className="flex items-center">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-10 h-10 rounded-full -translate-x-3" />
        <Skeleton className="w-10 h-10 rounded-full -translate-x-6" />
        <Skeleton className="w-[120px] h-6 rounded-full translate-x-1" />
      </div>
    ),
  },
);

const ExpenseDetailsPage = async ({ params }: ServerSideComponentProp) => {
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
          <div className="font-bold text-lg">₹ {expense?.amount}</div>
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
        <div className={""}>
          <div className="flex flex-col gap-2">
            {expense?.payments?.map((p) => (
              <div
                key={p.id}
                className="text-xs"
              >{`${replaceUserWithYou(userId, p?.userId, p?.user?.name)} paid ${RUPPEE_SYMBOL}${p?.amount}`}</div>
            ))}
          </div>
        </div>
        <hr />
        <Balance groupId={groupId} expense={expense} />
      </div>
    </AutoContainer>
  );
};

export default ExpenseDetailsPage;
