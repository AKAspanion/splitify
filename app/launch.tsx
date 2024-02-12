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

    setTimeout(() => {
      const noNotify = localStorage.getItem("no-notify") === "true";
      if (!noNotify) {
        Notification.requestPermission().then((result) => {
          console.log(result);
          if (result === "denied") {
            localStorage.setItem("no-notify", "true");
          }
        });
      }
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null;
};
