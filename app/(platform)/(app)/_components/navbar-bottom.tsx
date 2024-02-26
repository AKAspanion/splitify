"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ActivityIcon, UserIcon, UsersRoundIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export const NavbarBottom = () => {
  const { user } = useUser();
  const pathname = usePathname();
  return (
    <div className="bg-background z-10 block sm:hidden fixed bottom-0 w-screen p-4 px-8 border-t">
      <div className="md:max-w-screen-2xl mx-auto flex items-center w-full justify-between">
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
              <Image
                className="rounded-full"
                src={user?.imageUrl}
                alt="Profile logo"
                height={36}
                width={36}
              />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
};
