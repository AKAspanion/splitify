"use client";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/theme/dark-mode-toggle";
import { UserButton, useUser } from "@clerk/nextjs";

export const Navbar = () => {
  const { user } = useUser();
  return (
    <div className="fixed top-0 w-full h-14 px-4 border-b shadow-sm  flex items-center">
      <div className="md:max-w-screen-2xl mx-auto flex items-center w-full justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          {user ? (
            <UserButton />
          ) : (
            <div className="flex items-center gap-4 w-full justify-between md:justify-end">
              <Button size="sm" variant="outline" asChild>
                <Link href="/sign-in">Login</Link>
              </Button>
              <div className="flex gap-4 items-center justify-center">
                <Button size="sm" asChild>
                  <Link href="/sign-up">Join Splitify for free</Link>
                </Button>
              </div>
            </div>
          )}
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
};
