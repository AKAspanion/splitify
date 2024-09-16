"use client";

import {
  GroupCard,
  GroupCardLoading,
} from "@/app/(platform)/(app)/_components/group-card";
import { GET_METHOD_CALLBACK } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { Group } from "@prisma/client";
import React from "react";

export default function Groups({
  show = false,
  searchText = "",
}: {
  show: boolean;
  searchText: string;
}) {
  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ["groups"],
    queryFn: GET_METHOD_CALLBACK(
      `/api/app/group?show=${show}&searchText=${searchText}`,
      {},
    ),
    enabled: true,
  });

  return isLoading
    ? [1, 2, 3, 4, 5, 6].map((g) => {
        return (
          <React.Fragment key={g}>
            <GroupCardLoading />
          </React.Fragment>
        );
      })
    : groups?.map((g) => {
        return <GroupCard key={g.id} group={g} />;
      });
}
