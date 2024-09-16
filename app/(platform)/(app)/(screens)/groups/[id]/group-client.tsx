"use client";

import { useEffect, useMemo } from "react";
import {
  GroupCard,
  GroupCardLoading,
} from "@/app/(platform)/(app)/_components/group-card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { GET_METHOD_CALLBACK } from "@/utils/api";
import { Group } from "@prisma/client";

const GroupClient = ({ id }: { id: string }) => {
  const { data: group, isLoading } = useQuery<Group>({
    queryKey: [`group-${id}`],
    queryFn: GET_METHOD_CALLBACK(`/api/app/group/${id}?`, {}),
    enabled: true,
  });

  return isLoading || !group ? (
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
