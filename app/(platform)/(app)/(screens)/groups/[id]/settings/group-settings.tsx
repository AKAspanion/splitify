import { db } from "@/lib/db";
import { AutoContainer } from "@/components/container/auto-container";
import { auth } from "@clerk/nextjs";
import { GroupCard } from "@/app/(platform)/(app)/_components/group-card";
import { UserCardLoading } from "@/app/(platform)/(app)/_components/user-card";
import { Header } from "@/components/container/header";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NoData } from "@/components/no-data";

const GroupMembers = dynamic(() => import("./group-members"), {
  loading: () => (
    <div className="flex flex-col my-6">
      <Skeleton className="w-[100px] h-6 rounded-md" />
      <div className="flex flex-col mt-3 gap-4">
        {[1, 2, 3].map((i) => (
          <UserCardLoading key={i} />
        ))}
      </div>
    </div>
  ),
});

const GroupDelete = dynamic(() => import("./group-delete"), {
  loading: () => (
    <div className="my-6">
      <UserCardLoading />
    </div>
  ),
});

const GroupSettings = async ({
  params,
  searchParams,
}: ServerSideComponentProp) => {
  const id = params["id"] || "null";
  const backTo = searchParams["back"];

  const showAll = searchParams["show"] === "all";

  const { userId } = auth();

  const group = await db.group.findUnique({
    where: { id, users: { some: { id: userId || "null" } } },
  });

  return (
    <AutoContainer
      header={
        <Header
          backTo={backTo ? backTo : `/groups/${id}`}
          title="Group Settings"
          actions={
            group ? (
              <Link href={`/groups/${id}/edit`}>
                <Button variant="ghost" size="icon">
                  <PencilIcon className="w-5 h-5" />
                </Button>
              </Link>
            ) : null
          }
        />
      }
    >
      {group ? (
        <>
          <GroupCard
            group={group}
            description={
              <div className="pt-1 capitalize">
                {group?.type ? <Badge size="sm">{group?.type}</Badge> : null}
              </div>
            }
          />
          <GroupMembers showAll={showAll} id={id} backTo={backTo} />
          <hr />
          <div className="h-6" />
          <GroupDelete id={group?.id} />
        </>
      ) : (
        <NoData title="Group not found" />
      )}
    </AutoContainer>
  );
};

export default GroupSettings;
