"use client";

import { GroupCard } from "@/app/(platform)/(app)/_components/group-card";
import { Badge } from "@/components/ui/badge";
import { toGroupModel, type GroupDetail } from "@/lib/data/groups";

const GroupClient = ({ group }: { group: GroupDetail }) => (
  <GroupCard
    group={toGroupModel(group)}
    description={
      <div className="pt-1 capitalize">
        {group.type ? <Badge size="sm">{group.type}</Badge> : null}
      </div>
    }
  />
);

export default GroupClient;
