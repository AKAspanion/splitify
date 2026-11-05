"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { useRouteIds } from "@/hooks/use-route-ids";
import { useGroup } from "@/lib/data/groups";
import { GroupNotFound, LoadError } from "../_components/group-states";
import ExpensesList from "../expenses-list";

// All of the group's expenses, ten at a time as the list scrolls.
const AllExpensePage = () => {
  const { groupId } = useRouteIds();
  const { data: group, isLoading, error, refetch } = useGroup(groupId);

  const back = groupId ? `/groups/${groupId}` : "/groups";
  const header = <Header backTo={back} title={group?.title ?? "Expenses"} />;

  return (
    <AutoContainer header={header}>
      {groupId === null ? (
        <GroupNotFound />
      ) : isLoading ? null : error ? (
        <LoadError error={error} onRetry={() => refetch()} />
      ) : !group ? (
        <GroupNotFound />
      ) : (
        <ExpensesList
          groupId={groupId}
          backUrl={`/groups/${groupId}/expense`}
        />
      )}
    </AutoContainer>
  );
};

export default AllExpensePage;
