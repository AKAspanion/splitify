"use client";

import { DarkModeToggle } from "@/components/theme/dark-mode-toggle";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import {
  ClerkLoaded,
  ClerkLoading,
  UserProfile,
  useClerk,
} from "@clerk/nextjs";
import { ArrowLeftIcon, FingerprintIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ProfilePage = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <div className="flex items-start justify-center md:max-w-screen-2xl mx-auto">
      <div className="w-full px-0 pt-6 md:pb-12 flex flex-col items-center gap-6 overflow-x-hidden -mb-12">
        <ClerkLoading>
          <div className="p-8 h-[calc(100vh-80px)] flex items-center justify-center">
            <Spinner />
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <div className="w-full px-8 md:px-12 sticky top-0 flex itemx-center justify-between gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeftIcon />
              <span className="sr-only">Back</span>
            </Button>
            <div className="flex-1" />
            <DarkModeToggle />
            <Button
              variant="secondary"
              onClick={() => signOut(() => router.push("/"))}
            >
              Sign out
            </Button>
          </div>

          <div className="w-full">
            <div className="w-full px-8 md:px-12 flex gap-6 justify-end items-center">
              <Link href="/webauthn/register">
                <Button>
                  <FingerprintIcon />
                  <div>Register Biometrics</div>
                </Button>
              </Link>
            </div>
          </div>
          <div className="w-full">
            <hr />
          </div>
          <div className="w-full flex items-start justify-center">
            <UserProfile
              appearance={{
                elements: {
                  rootBox: {
                    padding: "0px 20px 24px 24px",
                    boxShadow: "none",
                    width: "100vw",
                  },
                  card: {
                    width: "100%",
                    maxWidth: "100%",
                    boxShadow: "none",
                    background: "transparent",
                  },
                  navbar: {
                    border: "none",
                  },
                  pageScrollBox: {
                    padding: "0px 12px 24px 6px",
                  },
                },
              }}
            />
          </div>
        </ClerkLoaded>
      </div>
    </div>
  );
};

export default ProfilePage;
