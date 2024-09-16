"use client";

import {
  GroupCard,
  GroupCardLoading,
} from "@/app/(platform)/(app)/_components/group-card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { GET_METHOD_CALLBACK } from "@/utils/api";
import { Group } from "@prisma/client";
import { useMemo } from "react";
import { getCurrency } from "@/utils/currency";

const GroupClient = ({ id }: { id: string }) => {
  const { data: group, isLoading } = useQuery<Group>({
    queryKey: [`group-${id}`],
    queryFn: GET_METHOD_CALLBACK(`/api/app/group/${id}?`, {}),
    enabled: true,
  });

  const currency = useMemo(
    () => (group?.currency ? getCurrency(group.currency)?.symbol : ""),
    [group?.currency],
  );

  return isLoading || !group ? (
    <GroupCardLoading />
  ) : (
    <div className="flex items-center justify-between">
      <GroupCard
        group={group}
        description={
          <div className="pt-1 capitalize flex gap-4 items-center">
            {group?.type ? <Badge size="sm">{group?.type}</Badge> : null}
          </div>
        }
      />
      <div className="p-3 text-lg">{`${currency || ""}`}</div>
    </div>
  );
};

export default GroupClient;
