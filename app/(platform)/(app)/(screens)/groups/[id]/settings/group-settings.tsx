"use client";

import { AutoContainer } from "@/components/container/auto-container";
import {
  GroupCard,
  GroupCardLoading,
} from "@/app/(platform)/(app)/_components/group-card";
import { Header } from "@/components/container/header";
import { Badge } from "@/components/ui/badge";
import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRouteIds } from "@/hooks/use-route-ids";
import { toGroupModel, useGroup } from "@/lib/data/groups";
import { GroupNotFound, LoadError } from "../_components/group-states";
import GroupDelete from "./group-delete";
import GroupMembers from "./group-members";

const GroupSettings = () => {
  const { groupId: id } = useRouteIds();
  const params = useSearchParams();
  const backTo = params.get("back") ?? "";
  const showAll = params.get("show") === "all";

  const { data: group, isLoading, error, refetch } = useGroup(id);

  return (
    <AutoContainer
      header={
        <Header
          backTo={backTo ? backTo : id ? `/groups/${id}` : "/groups"}
          title="Group Settings"
          actions={
            group ? (
              <Link href={`/groups/${id}/edit`}>
                <Button variant="ghost" size="icon" aria-label="Edit group">
                  <PencilIcon className="w-5 h-5" />
                </Button>
              </Link>
            ) : null
          }
        />
      }
    >
      {id === null ? (
        <GroupNotFound />
      ) : isLoading ? (
        <GroupCardLoading />
      ) : error ? (
        <LoadError error={error} onRetry={() => refetch()} />
      ) : !group ? (
        <GroupNotFound />
      ) : (
        <>
          <GroupCard
            group={toGroupModel(group)}
            description={
              <div className="pt-1 capitalize">
                {group.type ? <Badge size="sm">{group.type}</Badge> : null}
              </div>
            }
          />
          <GroupMembers showAll={showAll} id={id} backTo={backTo} />
          <hr />
          <div className="h-6" />
          <GroupDelete id={group.id} />
        </>
      )}
    </AutoContainer>
  );
};

export default GroupSettings;
