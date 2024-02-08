import { AutoContainer } from "@/components/container/auto-container";
import { Input } from "@/components/ui/input";
import { Form } from "./form";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { Group } from "@prisma/client";

const ExpenseFormPage = async () => {
  const { userId } = auth();
  const data = await db.user.findUnique({
    where: { clerk_id: userId || "null" },
    include: { groups: true },
  });

  const groups = data?.groups || [];

  return (
    <AutoContainer
      header={
        <div className="flex justify-between items-center">
          <div className="font-semibold text-lg">Add an expense</div>
        </div>
      }
    >
      <Form groups={groups} />
    </AutoContainer>
  );
};

export default ExpenseFormPage;
