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
import { NoData } from "@/components/no-data";
import { urlEncode } from "@/utils/func";

const GroupUsers = dynamic(() => import("./group-users"), {
  loading: () => <UserAvatarsLoading />,
});

const ExpensesTabs = dynamic(() => import("./expenses-tabs"), {
  loading: () => <ExpensesTabsLoader />,
});

const ExpensesTabsLoader = () => {
  return (
    <div className="grid grid-cols-3 gap-2 pb-6">
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
    </div>
  );
};

const GroupDetails = async ({
  params,
  searchParams,
}: ServerSideComponentProp) => {
  const { userId } = auth();
  const id = params["id"] || "null";

  const tab = searchParams["tab"] || "Expenses";

  const backUrl = urlEncode({
    path: `/groups/${id}`,
    query: searchParams,
  });

  const group = await db.group.findUnique({
    where: { id, users: { some: { id: userId || "null" } } },
  });

  return (
    <AutoContainer
      id="expenseslist"
      header={
        <Header
          backTo="/groups"
          title={""}
          actions={
            group ? (
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
            ) : null
          }
        />
      }
    >
      {group ? (
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
          <ExpensesTabs id={id} backUrl={backUrl} tab={tab} />
        </div>
      ) : (
        <NoData title="Group not found" />
      )}
    </AutoContainer>
  );
};

export default GroupDetails;
