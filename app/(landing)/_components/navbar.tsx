"use client";

import { Logo } from "@/components/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DarkModeToggle } from "@/components/theme/dark-mode-toggle";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/firebase/auth";

/**
 * The landing page's navbar. Its links out are plain anchors, full page loads rather than client navigations: the
 * landing page may have loaded the ad script, and a client navigation would carry it into the app and the sign-in
 * screens (knowledge/decisions/adsense-on-public-pages-only.md).
 */
export const Navbar = () => {
  const { status } = useAuth();
  return (
    <div className="fixed top-0 w-full h-16 px-4 border-b shadow-xs  flex items-center">
      <div className="md:max-w-(--breakpoint-2xl) mx-auto flex items-center w-full">
        <Logo to={status === "signed-in" ? "/groups/" : "/"} fullPageLoad />
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="flex items-center gap-4" aria-label="Loading">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          ) : status === "signed-in" ? (
            <div className="flex items-center gap-4">
              {/* A full page load on purpose, so the ad script stays behind: see the comment above. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a className={buttonVariants({ size: "sm" })} href="/groups/">
                Go to app
              </a>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void signOut()}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4 w-full justify-between md:justify-end">
              <a
                className={buttonVariants({ size: "sm", variant: "outline" })}
                href="/sign-in/"
              >
                Sign in
              </a>
              <a className={buttonVariants({ size: "sm" })} href="/sign-up/">
                Sign up
              </a>
            </div>
          )}
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
};
