"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";

/** `/` has no page of its own: it sends a signed-in person to their groups and everyone else to sign in. */
export function HomeRedirect() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "signed-in") router.replace("/groups/");
    else if (status === "signed-out") router.replace("/sign-in/");
  }, [status, router]);

  return (
    <div
      role="status"
      className="flex min-h-dvh items-center justify-center text-muted-foreground"
    >
      <Spinner />
      <span className="sr-only">Loading</span>
    </div>
  );
}
