"use client";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DarkModeToggle } from "@/components/theme/dark-mode-toggle";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/firebase/auth";

export const Navbar = () => {
  const { status } = useAuth();
  return (
    <div className="fixed top-0 w-full h-16 px-4 border-b shadow-xs  flex items-center">
      <div className="md:max-w-(--breakpoint-2xl) mx-auto flex items-center w-full">
        <Logo to={status === "signed-in" ? "/groups" : "/"} />
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="flex items-center gap-4" aria-label="Loading">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          ) : status === "signed-in" ? (
            <div className="flex items-center gap-4">
              <Link href="/groups">
                <Button size="sm">Go to app</Button>
              </Link>
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
              <Link href="/sign-in/">
                <Button size="sm" variant="outline">
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up/">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
};
