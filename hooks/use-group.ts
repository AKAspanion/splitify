"use client";

import { useGroupStore } from "@/store/group-provider";
import { useEffect, useMemo } from "react";

const useGroup = (id: string) => {
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

  return { loading, group };
};

export default useGroup;
