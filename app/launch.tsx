"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export const Launch = () => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "" || pathname === "/";

  useEffect(() => {
    if (user?.id && isHome) {
      router.push("/groups");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null;
};
