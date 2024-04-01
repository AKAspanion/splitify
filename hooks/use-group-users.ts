"use client";

import { useGroupStore } from "@/store/group-provider";
import { useEffect, useMemo } from "react";

const useGroupUsers = (id: string) => {
  const { setGroupUsers, groupUsers, groupUsersLoading } = useGroupStore(
    (s) => s,
  );
  const users = useMemo(() => {
    return groupUsers[id];
  }, [groupUsers, id]);

  const loading = useMemo(() => {
    return groupUsersLoading[id];
  }, [groupUsersLoading, id]);

  useEffect(() => {
    if (!users) {
      setGroupUsers(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, users };
};

export default useGroupUsers;
