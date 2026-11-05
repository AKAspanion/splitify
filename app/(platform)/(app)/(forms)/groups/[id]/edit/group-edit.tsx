"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import GroupFormLoading from "@/app/(platform)/(app)/_components/group-form-loading";
import {
  GroupNotFound,
  LoadError,
} from "@/app/(platform)/(app)/(screens)/groups/[id]/_components/group-states";
import { useRouteIds } from "@/hooks/use-route-ids";
import { useGroup } from "@/lib/data/groups";
import Form from "./form";

const GroupEdit = () => {
  const { groupId: id } = useRouteIds();
  const { data: group, isLoading, error, refetch } = useGroup(id);

  if (id !== null && isLoading) return <GroupFormLoading />;

  return (
    <AutoContainer
      header={<Header backTo={`/groups/${id || ""}`} title={`Update group`} />}
    >
      {id === null || (!error && !group) ? (
        <GroupNotFound />
      ) : error ? (
        <LoadError error={error} onRetry={() => refetch()} />
      ) : group ? (
        <Form
          id={group.id}
          title={group.title}
          type={group.type}
          description={group.description}
        />
      ) : null}
    </AutoContainer>
  );
};

export default GroupEdit;
