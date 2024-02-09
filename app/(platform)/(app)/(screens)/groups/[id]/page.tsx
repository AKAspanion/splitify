import { db } from "@/lib/db";
import { GroupCard } from "../../../_components/group-card";
import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, ArrowLeftIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs";

const GroupDetailsPage = async ({ params }: ServerSideComponentProp) => {
  const id = params["id"] || "null";
  const { userId } = auth();

  const group = await db.group.findUnique({
    where: { id, users: { some: { id: userId || "null" } } },
  });

  return (
    <AutoContainer
      header={
        <div className="flex w-full gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <Link href="/groups">
              <Button variant="ghost" size="icon">
                <ArrowLeftIcon />
              </Button>
            </Link>
          </div>
          <div>
            <Link href={`/groups/${id}/settings`}>
              <Button variant="ghost" size="icon">
                <SettingsIcon />
              </Button>
            </Link>
          </div>
        </div>
      }
    >
      <GroupCard group={group} />
      <div className="p-16 flex flex-col items-center gap-2">
        <AlertTriangleIcon className="text-yellow-500" />
        <div className="text-center ">No expenses found.</div>
      </div>
    </AutoContainer>
  );
};

export default GroupDetailsPage;
