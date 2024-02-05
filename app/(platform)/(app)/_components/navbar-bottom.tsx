"use client";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { GroupIcon, UserIcon, UsersIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export const NavbarBottom = () => {
  const { user } = useUser();
  return (
    <div className="block sm:hidden fixed bottom-0 w-screen p-4 px-8 border-t">
      <div className="md:max-w-screen-2xl mx-auto flex items-center w-full justify-between">
        <div className="flex items-center justify-between w-full">
          <Link href="/groups">
            <Button variant="ghost" size="icon">
              <UsersIcon />
            </Button>
          </Link>
          <Link href="/friends">
            <Button variant="ghost" size="icon">
              <UserIcon />
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
