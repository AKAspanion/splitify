import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { ActivityIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/container/header";
import dynamic from "next/dynamic";
import { DownloadReport } from "./_components/download-report";
import { urlEncode } from "@/utils/func";
import GroupClient from "./group-client";
import GroupUsers from "./group-users";

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
  const id = params["id"] || "null";

  const tab = searchParams["tab"] || "Expenses";

  const searchText = searchParams["text"];

  const backUrl = urlEncode({
    path: `/groups/${id}`,
    query: searchParams,
  });

  return (
    <AutoContainer
      id="expenseslist"
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
        <GroupClient id={id} />
        <GroupUsers id={id} backUrl={backUrl} />
        <ExpensesTabs id={id} tab={tab} backUrl={backUrl} />
      </div>
    </AutoContainer>
  );
};

export default GroupDetails;
