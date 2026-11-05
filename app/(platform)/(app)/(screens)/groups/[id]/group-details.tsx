"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { ActivityIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/container/header";
import { GroupCardLoading } from "@/app/(platform)/(app)/_components/group-card";
import { UserAvatarsLoading } from "@/app/(platform)/(app)/_components/user-avatars";
import { useRouteIds } from "@/hooks/use-route-ids";
import { useGroup } from "@/lib/data/groups";
import { urlEncode } from "@/utils/func";
import { DownloadReport } from "./_components/download-report";
import { GroupNotFound, LoadError } from "./_components/group-states";
import ExpensesTabs from "./expenses-tabs";
import GroupClient from "./group-client";
import GroupUsers from "./group-users";

const GroupDetailsLoading = () => (
  <div className="flex flex-col gap-6 py-6 px-8">
    <div className="flex justify-between">
      <Skeleton className="w-10 h-10" />
      <div className="flex justify-between gap-4">
        <Skeleton className="w-10 h-10 rounded-md" />
        <Skeleton className="w-10 h-10 rounded-md" />
        <Skeleton className="w-10 h-10 rounded-md" />
      </div>
    </div>
    <GroupCardLoading />
    <UserAvatarsLoading />
  </div>
);

const GroupDetails = () => {
  const { groupId: id } = useRouteIds();
  const searchParams = Object.fromEntries(useSearchParams().entries());
  const { data: group, isLoading, error, refetch } = useGroup(id);

  const tab = searchParams["tab"] || "Expenses";

  if (id === null)
    return (
      <AutoContainer header={<Header backTo="/groups" title="" />}>
        <GroupNotFound />
      </AutoContainer>
    );

  if (isLoading) return <GroupDetailsLoading />;

  if (error)
    return (
      <AutoContainer header={<Header backTo="/groups" title="" />}>
        <LoadError error={error} onRetry={() => refetch()} />
      </AutoContainer>
    );

  if (!group)
    return (
      <AutoContainer header={<Header backTo="/groups" title="" />}>
        <GroupNotFound />
      </AutoContainer>
    );

  const backUrl = urlEncode({
    path: `/groups/${id}`,
    query: searchParams,
  });

  return (
    <AutoContainer
      id="expenses-list"
      header={
        <Header
          backTo="/groups"
          title={""}
          actions={
            <>
              <Link href={`/groups/${id}/activity`}>
                <Button variant="ghost" size="icon" aria-label="Activity">
                  <ActivityIcon />
                </Button>
              </Link>
              <DownloadReport groupId={id} />
              <Link href={`/groups/${id}/settings`}>
                <Button variant="ghost" size="icon" aria-label="Settings">
                  <SettingsIcon />
                </Button>
              </Link>
            </>
          }
        />
      }
    >
      <div className="flex flex-col gap-6">
        <GroupClient group={group} />
        <GroupUsers id={id} backUrl={backUrl} />
        <ExpensesTabs id={id} tab={tab} backUrl={backUrl} />
      </div>
    </AutoContainer>
  );
};

export default GroupDetails;
