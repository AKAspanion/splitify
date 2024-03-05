import { db } from "@/lib/db";
import { GroupCard } from "@/app/(platform)/(app)/_components/group-card";
import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { ActivityIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/container/header";
import { UserAvatarsLoading } from "@/app/(platform)/(app)/_components/user-avatars";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { DownloadReport } from "./_components/download-report";

const GroupUsers = dynamic(() => import("./group-users"), {
  loading: () => <UserAvatarsLoading />,
});

const ExpensesTabs = dynamic(() => import("./expenses-tabs"), {
  loading: () => (
    <div className="grid grid-cols-3 gap-2 pb-6">
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
    </div>
  ),
});

const GroupDetails = async ({
  id,
  backUrl,
}: {
  id: string;
  backUrl: string;
}) => {
  const { userId } = auth();

  const group = await db.group.findUnique({
    where: { id, users: { some: { id: userId || "null" } } },
  });

  return (
    <AutoContainer
      header={
        <Header
          backTo="/groups"
          title={""}
          actions={
            <>
              <Link href={`/groups/${id}/activity`}>
                <Button variant="ghost" size="icon">
                  <ActivityIcon />
                </Button>
              </Link>
              <DownloadReport groupId={id} />
              <Link href={`/groups/${id}/settings`}>
                <Button variant="ghost" size="icon">
                  <SettingsIcon />
                </Button>
              </Link>
            </>
          }
        />
      }
    >
      <div className="flex flex-col gap-6">
        <GroupCard
          group={group}
          description={
            <div className="pt-1 capitalize">
              {group?.type ? <Badge size="sm">{group?.type}</Badge> : null}
            </div>
          }
        />
        <GroupUsers id={id} backUrl={backUrl} />
        <ExpensesTabs id={id} backUrl={backUrl} />
      </div>
    </AutoContainer>
  );
};

export default GroupDetails;
