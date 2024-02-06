"use client";
import Link from "next/link";
import Image from "next/image";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/theme/dark-mode-toggle";
import { ClerkLoading, ClerkLoaded, UserButton, useUser } from "@clerk/nextjs";
import Spinner from "@/components/ui/spinner";

export const Navbar = () => {
  const { user } = useUser();
  // const user: any = { imageUrl: "" };
  return (
    <div className="fixed top-0 w-full h-16 px-4 border-b shadow-sm  flex items-center">
      <div className="md:max-w-screen-2xl mx-auto flex items-center w-full">
        <Logo />
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/profile">
              <Image
                className="rounded-full"
                src={user?.imageUrl}
                alt="Profile logo"
                height={40}
                width={40}
              />
            </Link>
          ) : (
            <div className="flex items-center gap-4 w-full justify-between md:justify-end">
              <ClerkLoading>
                <div className="w-10">
                  <Spinner />
                </div>
              </ClerkLoading>
              <ClerkLoaded>
                <Link href="/sign-in">
                  <Button size="sm" variant="outline">
                    Login
                  </Button>
                </Link>
                <div className="flex gap-4 items-center justify-center">
                  <Link href="/sign-up">
                    <Button size="sm">Sign up</Button>
                  </Link>
                </div>
              </ClerkLoaded>
            </div>
          )}
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
};
