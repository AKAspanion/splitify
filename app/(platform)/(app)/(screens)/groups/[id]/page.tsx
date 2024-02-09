import { db } from "@/lib/db";
import { GroupCard } from "@/app/(platform)/(app)/_components/group-card";
import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs";
import { ExpenseCard } from "@/app/(platform)/(app)/_components/expense-card";
import { Header } from "@/components/container/header";

const GroupDetailsPage = async ({ params }: ServerSideComponentProp) => {
  const id = params["id"] || "null";
  const { userId } = auth();

  const group = await db.group.findUnique({
    where: { id, users: { some: { id: userId || "null" } } },
  });

  const expenses = await db.expense.findMany({
    where: { groupId: id },
    include: { splits: true, payments: { include: { user: true } } },
  });

  return (
    <AutoContainer
      header={
        <Header
          backTo="/groups"
          title={group?.title}
          actions={
            <Link href={`/groups/${id}/settings`}>
              <Button variant="ghost" size="icon">
                <SettingsIcon />
              </Button>
            </Link>
          }
        />
      }
    >
      <GroupCard group={group} />
      <div className="pt-6 pb-3 font-semibold text-normal">Group expenses</div>
      <div className="pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {expenses?.map((e) => (
          <ExpenseCard expense={e} key={e.id} />
        ))}
      </div>
    </AutoContainer>
  );
};

export default GroupDetailsPage;
