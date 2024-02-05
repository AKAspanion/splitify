"use client";

import Link from "next/link";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ClerkLoaded, ClerkLoading, useUser } from "@clerk/nextjs";
import Spinner from "@/components/ui/spinner";

const textFont = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const LandingPage = () => {
  const { user } = useUser();
  return (
    <div className="flex items-center justify-center flex-col pt-12">
      <div className={cn("flex items-center justify-center flex-col")}>
        <h1 className="uppercase text-3xl font-extralight md:text-6xl text-center text-neutral-800dark:text-neutral-200 mb-6">
          Spliting Expenses
        </h1>
        <div className="uppercase text-md md:text-4xl bg-gradient-to-r from-green-600 to-lime-600 text-white px-4 py-2 rounded-md w-fit">
          made easy
        </div>
      </div>
      <div
        className={cn(
          "text-sm md:text-xl text-neutral-400 md:mt-8 max-w-xs md:max-w-3xl text-center mx-auto mt-12",
          textFont.className
        )}
      >
        Keep track of your shared expenses and balances with housemates, trips,
        groups, friends, and family.
      </div>
      <ClerkLoaded>
        {user ? null : (
          <Button className="mt-6" size="lg" asChild>
            <Link href="/sign-up">Join Splitify for free</Link>
          </Button>
        )}
      </ClerkLoaded>
    </div>
  );
};

export default LandingPage;
