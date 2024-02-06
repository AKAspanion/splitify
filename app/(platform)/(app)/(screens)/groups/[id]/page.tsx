import { db } from "@/lib/db";
import { GroupCard } from "../../../_components/group-card";
import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, ArrowLeftIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";

const GroupDetailsPage = async ({ params }: ServerSideComponentProp) => {
  const group = await db.group.findUnique({ where: { id: params["id"] } });
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
            <div className="font-semibold text-lg">{group?.title || ""}</div>
          </div>
          <div>
            <Button variant="ghost" size="icon">
              <SettingsIcon />
            </Button>
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
