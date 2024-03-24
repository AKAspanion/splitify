"use client";

import { useEffect, useMemo } from "react";
import { GroupCard, GroupCardLoading } from "../../../_components/group-card";
import { useGroupStore } from "@/lib/store/group-provider";
import { Badge } from "@/components/ui/badge";

const GroupClient = ({ id }: { id: string }) => {
  const { setGroup, groups, groupLoading } = useGroupStore((s) => s);
  const group = useMemo(() => {
    return groups[id];
  }, [groups, id]);
  const loading = useMemo(() => {
    return groupLoading[id];
  }, [groupLoading, id]);

  useEffect(() => {
    if (!group) {
      setGroup(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loading || !group ? (
    <GroupCardLoading />
  ) : (
    <GroupCard
      group={group}
      description={
        <div className="pt-1 capitalize">
          {group?.type ? <Badge size="sm">{group?.type}</Badge> : null}
        </div>
      }
    />
  );
};

export default GroupClient;
