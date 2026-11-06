"use client";

import { useEffect } from "react";
import { AppLoading } from "@/components/app-loading";
import { useAuth } from "@/hooks/use-auth";

/**
 * `/` has no page of its own: it sends a signed-in person to their groups and everyone else to sign in.
 * It leaves by a full page load: it is reached from the ad pages, and the ad script they loaded must not follow into
 * the app.
 */
export function HomeRedirect() {
  const { status } = useAuth();

  useEffect(() => {
    if (status === "signed-in") window.location.replace("/groups/");
    else if (status === "signed-out") window.location.replace("/sign-in/");
  }, [status]);

  return <AppLoading />;
}
