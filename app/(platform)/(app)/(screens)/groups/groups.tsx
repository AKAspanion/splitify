"use client";

import {
  GroupCard,
  GroupCardLoading,
} from "@/app/(platform)/(app)/_components/group-card";
import { toGroupModel, type GroupSummary } from "@/lib/data/groups";
import { LoadError } from "./[id]/_components/group-states";
import React from "react";

export default function Groups({
  groups,
  isLoading,
  error,
  onRetry,
}: {
  groups: GroupSummary[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  if (isLoading)
    return [1, 2, 3, 4, 5, 6].map((g) => (
      <React.Fragment key={g}>
        <GroupCardLoading />
      </React.Fragment>
    ));

  if (error)
    return (
      <div className="col-span-full">
        <LoadError error={error} onRetry={onRetry} />
      </div>
    );

  return groups?.map((g) => <GroupCard key={g.id} group={toGroupModel(g)} />);
}
