"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { isSignOutIntended, signedOutDestination } from "@/lib/auth-redirect";
import { AppLoading } from "@/components/app-loading";

/** Renders its children when signed in, the logo while loading, and sends signed-out people to sign in. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "signed-out")
      router.replace(signedOutDestination(pathname, isSignOutIntended()));
  }, [status, pathname, router]);

  if (status !== "signed-in") return <AppLoading />;
  return <>{children}</>;
}
