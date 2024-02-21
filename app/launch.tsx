"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";

export const Launch = () => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [, setInitialized] = useState(false);
  const isHome = pathname === "" || pathname === "/";

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONE_SIGNAL_APP_ID;
    const safari_web_id = process.env.NEXT_PUBLIC_ONE_SIGNAL_SAFARI_WEB_ID;
    if (user?.id && appId) {
      OneSignal.init({
        appId,
        safari_web_id,
        notifyButton: { enable: true },
        allowLocalhostAsSecureOrigin: true,
      })
        .then(() => {
          console.log("Initialization done");
          setInitialized(true);
          return OneSignal.Slidedown.promptPush();
          // do other stuff
        })
        .then(() => {
          console.log("Setting up user");
          OneSignal.login(user?.id);
          if (user?.primaryEmailAddress?.emailAddress) {
            OneSignal.User.addEmail(user?.primaryEmailAddress?.emailAddress);
          }
        })
        .catch((e) => {
          console.log("Error in onesignal init", e);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && isHome) {
      router.push("/groups");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null;
};
