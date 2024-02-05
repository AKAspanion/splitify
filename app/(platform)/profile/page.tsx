"use client";

import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import {
  ClerkLoaded,
  ClerkLoading,
  UserProfile,
  useClerk,
} from "@clerk/nextjs";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ProfilePage = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <div className="flex items-start justify-center w-full">
      <div className="px-0 pt-6 md:pb-12 flex flex-col items-center gap-6 overflow-x-hidden -mb-12">
        <ClerkLoading>
          <div className="p-8 w-[880px] h-[calc(100vh-80px)] flex items-center justify-center">
            <Spinner />
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <div className="w-full px-8 md:px-12 sticky top-0 flex itemx-center justify-between gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="icon">
                <ArrowLeftIcon />
                <span className="sr-only">Back</span>
              </Button>
            </Link>
            <div className="flex-1 w-[720px]" />
            <Button
              variant="secondary"
              onClick={() => signOut(() => router.push("/"))}
            >
              Sign out
            </Button>
          </div>
          <div className="w-fit flex items-start justify-center px-12 pb-12">
            <UserProfile />
          </div>
        </ClerkLoaded>
      </div>
    </div>
  );
};

export default ProfilePage;
