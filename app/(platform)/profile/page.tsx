"use client";

import { VerifyEmailBanner } from "@/components/auth/verify-email-banner";
import { DarkModeToggle } from "@/components/theme/dark-mode-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useMe } from "@/lib/data/profile";
import { leaveForSignIn } from "@/lib/auth-redirect";
import { signOut } from "@/lib/firebase/auth";
import { toUserMessage } from "@/lib/data/errors";
import {
  ArrowLeftIcon,
  FingerprintIcon,
  MessageSquareHeart,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import DeleteAccountAction from "./delete-account-action";
import NotificationAction from "./notification-action";

const ProfilePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const me = useMe();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignout = async () => {
    setSigningOut(true);
    try {
      // Signed out first, then a full page load to sign in: no signed-in screen is left to show.
      await signOut();
      leaveForSignIn();
    } catch (error) {
      toast.error(toUserMessage(error));
      setSigningOut(false);
    }
  };

  const name = me.data?.name || user?.name || null;
  const email = me.data?.email || user?.email || null;

  return (
    <>
      <VerifyEmailBanner />
      <div className="flex items-start justify-center md:max-w-(--breakpoint-2xl) mx-auto">
        <div className="w-full px-0 pt-6 flex flex-col items-center gap-6 overflow-x-hidden">
          <div className="w-full px-8 md:px-12 sticky top-0 flex items-center justify-between gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeftIcon />
              <span className="sr-only">Back</span>
            </Button>
            <div className="flex-1" />
            <Link href="/feedback/add">
              <Button variant="ghost" size="icon">
                <MessageSquareHeart />
                <span className="sr-only">Feedback</span>
              </Button>
            </Link>
            <DarkModeToggle />
            <Button
              variant="secondary"
              loading={signingOut}
              disabled={signingOut}
              onClick={handleSignout}
            >
              Sign out
            </Button>
          </div>

          <div className="w-full px-8 md:px-12 flex flex-col gap-1">
            {name || email ? (
              <>
                <div className="text-2xl font-semibold break-words">
                  {name ?? email}
                </div>
                {name && email ? (
                  <div className="text-sm break-all">{email}</div>
                ) : null}
              </>
            ) : (
              <>
                <Skeleton className="w-[200px] h-8" />
                <Skeleton className="w-[240px] h-5" />
              </>
            )}
          </div>

          <div className="w-full">
            <div className="w-full px-8 md:px-12 flex flex-wrap gap-4 md:gap-6 items-center">
              <Link href="/webauthn/register">
                <Button>
                  <FingerprintIcon />
                  <div>Biometrics</div>
                </Button>
              </Link>
              <NotificationAction />
              <DeleteAccountAction />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
