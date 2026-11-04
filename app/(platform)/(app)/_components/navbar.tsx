"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getAvatarLetters } from "@/utils/func";

export const Navbar = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  return (
    <div className="fixed hidden sm:flex z-10 bg-background top-0 w-full h-16 border-b shadow-xs items-center">
      <div className="md:max-w-(--breakpoint-2xl) mx-auto flex items-center w-full px-8">
        <Logo to="/groups" />
        <div className="hidden sm:flex items-center pl-8">
          <Link href="/groups">
            <Button
              className={pathname.startsWith("/groups") ? "underline" : ""}
              variant="link"
            >
              Groups
            </Button>
          </Link>
          <Link href="/activity">
            <Button
              className={pathname.startsWith("/activity") ? "underline" : ""}
              variant="link"
            >
              Activity
            </Button>
          </Link>
          <Link href="/friends">
            <Button
              className={pathname.startsWith("/friends") ? "underline" : ""}
              variant="link"
            >
              Friends
            </Button>
          </Link>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          {user ? (
            <Link className="hidden sm:block" href="/profile">
              <span
                aria-label="Profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground"
              >
                {getAvatarLetters(user.name || user.email)}
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
};
