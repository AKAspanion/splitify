"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import Spinner from "@/components/ui/spinner";

/** Renders its children when signed in, a full-page spinner while loading, and sends signed-out people to sign in. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "signed-out")
      router.replace(`/sign-in/?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  if (status !== "signed-in") {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-label="Loading"
      >
        <Spinner size="lg" />
      </div>
    );
  }
  return <>{children}</>;
}
