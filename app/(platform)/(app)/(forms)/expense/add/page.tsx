import { AutoContainer } from "@/components/container/auto-container";
import { Form } from "./(form)/form";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ExpenseFormPage = async ({ searchParams }: ServerSideComponentProp) => {
  const { userId } = auth();
  const data = await db.user.findUnique({
    where: { clerk_id: userId || "null" },
    include: { groups: { include: { users: true } } },
  });

  const groups = data?.groups || [];

  const groupdId = searchParams["groupId"] || "";
  const backTo = groupdId ? `/groups/${groupdId}` : `/groups`;

  return (
    <AutoContainer
      header={
        <div className="flex justify-between items-center gap-6">
          <Link href={backTo}>
            <Button type="button" variant={"ghost"} size={"icon"}>
              <ArrowLeftIcon />
            </Button>
          </Link>
          <div className="font-semibold text-lg">Add an expense</div>
        </div>
      }
    >
      <Form groups={groups} />
    </AutoContainer>
  );
};

export default ExpenseFormPage;
