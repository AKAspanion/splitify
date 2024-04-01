"use client";

import { useEffect, useMemo } from "react";
import {
  GroupCard,
  GroupCardLoading,
} from "@/app/(platform)/(app)/_components/group-card";
import { useGroupStore } from "@/store/group-provider";
import { Badge } from "@/components/ui/badge";
import useGroup from "@/hooks/use-group";

const GroupClient = ({ id }: { id: string }) => {
  const { group, loading } = useGroup(id);

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
