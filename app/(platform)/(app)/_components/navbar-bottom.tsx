"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ActivityIcon, UserIcon, UsersRoundIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAvatarLetters } from "@/utils/func";

export const NavbarBottom = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  return (
    <div className="bg-background z-10 block sm:hidden fixed bottom-0 w-screen p-4 px-8 border-t">
      <div className="md:max-w-(--breakpoint-2xl) mx-auto flex items-center w-full justify-between">
        <div className="flex items-center justify-between w-full">
          <Link href="/groups">
            <Button
              variant={pathname.startsWith("/groups") ? "outline" : "ghost"}
              size="icon"
            >
              <UsersRoundIcon />
            </Button>
          </Link>
          <Link href="/friends">
            <Button
              variant={pathname.startsWith("/friends") ? "outline" : "ghost"}
              size="icon"
            >
              <UserIcon />
            </Button>
          </Link>
          <Link href="/activity">
            <Button
              variant={pathname.startsWith("/activity") ? "outline" : "ghost"}
              size="icon"
            >
              <ActivityIcon className="w-5 h-5" />
            </Button>
          </Link>
          {user ? (
            <Link href="/profile">
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
