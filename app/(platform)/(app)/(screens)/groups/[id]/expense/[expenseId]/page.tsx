import { ExpenseCard } from "@/app/(platform)/(app)/_components/expense-card";
import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { db } from "@/lib/db";
import { Actions } from "./actions";
import { auth } from "@clerk/nextjs";
import { format } from "date-fns";
import { UserAvatars } from "@/app/(platform)/(app)/_components/user-avatars";
import { whoPaidExpense } from "@/app/(platform)/(app)/_utils/expense";
import { replaceUserWithYou } from "@/app/(platform)/(app)/_utils/user";
import { RUPPEE_SYMBOL } from "@/constants/ui";

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

  const users = expense?.payments?.map((p) => p.user);

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
        <div className={"pl-14"}>
          <div className="font-bold text-lg">₹ {expense?.amount}</div>
          <div className="font-thin text-sm">
            Added by {addedBy} on {createDate}
          </div>
        </div>
        <UserAvatars
          users={users}
          action={
            <div className="text-sm">
              {whoPaidExpense(expense?.amount, expense?.payments || [])}
            </div>
          }
        />
        <div className={"pl-14"}>
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
      </div>
    </AutoContainer>
  );
};

export default ExpenseDetailsPage;
