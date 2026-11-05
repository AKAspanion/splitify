"use client";

import {
  GroupCard,
  GroupCardLoading,
} from "@/app/(platform)/(app)/_components/group-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Group } from "@/types/shared";
import { toUserMessage } from "@/lib/data/errors";
import { useSharedGroups, type GroupSummary } from "@/lib/data/people";

// GroupCard reads the older Prisma `Group` shape; this fills the fields it shows from a SQL Connect group.
const toCardGroup = (g: GroupSummary) =>
  ({ ...g, image_url: g.imageUrl ?? null }) as unknown as Group;

const SharedGroups = ({ id }: { id: string }) => {
  const { data: groups, isPending, error, refetch } = useSharedGroups(id);

  if (isPending)
    return (
      <div>
        <Skeleton className="mb-3 h-6 w-[100px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <GroupCardLoading key={i} compact />
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col gap-3 text-sm">
        <div>{toUserMessage(error)}</div>
        <div>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );

  return groups.length === 0 ? (
    <div className="text-sm font-light">
      You don&apos;t share any groups yet.
    </div>
  ) : (
    <div>
      <div className="font-semibold text-normal pb-3">Shared groups</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <GroupCard group={toCardGroup(g)} key={g.id} compact />
        ))}
      </div>
    </div>
  );
};

export default SharedGroups;
