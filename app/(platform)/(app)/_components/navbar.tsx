"use client";
import Link from "next/link";
import Image from "next/image";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/theme/dark-mode-toggle";
import { useUser } from "@clerk/nextjs";

export const Navbar = () => {
  const { user } = useUser();
  return (
    <div className="fixed z-10 bg-background top-0 w-full h-16 px-8 border-b shadow-sm  flex items-center">
      <div className="md:max-w-screen-2xl mx-auto flex items-center w-full">
        <Logo to="/dashboard" />
        <div className="hidden sm:flex items-center pl-8">
          <Link href="/groups">
            <Button variant="link">Groups</Button>
          </Link>
          <Link href="/friends">
            <Button variant="link">Friends</Button>
          </Link>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          {user ? (
            <Link className="hidden sm:block" href="/profile">
              <Image
                className="rounded-full"
                src={user?.imageUrl}
                alt="Profile logo"
                height={40}
                width={40}
              />
            </Link>
          ) : null}
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
};
