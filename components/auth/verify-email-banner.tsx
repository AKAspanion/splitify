"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  isVerifyBannerSnoozed,
  readVerifyBannerDismissal,
  writeVerifyBannerDismissal,
} from "@/lib/auth/verify-banner-dismissal";
import { toUserMessage } from "@/lib/data/errors";
import { sendVerificationEmail } from "@/lib/firebase/auth";

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Shown while the signed-in person's email is unverified, with Resend email. `dismissable` (Groups) adds Dismiss, which
 * hides it for 7 days; without it (Profile) it always shows. It clears on the next token refresh or sign-in once the
 * email is verified.
 */
export function VerifyEmailBanner({
  dismissable = false,
}: {
  dismissable?: boolean;
}) {
  const { status, user } = useAuth();
  if (status !== "signed-in" || !user || user.emailVerified) return null;
  // Keyed on the person, so another person signing in on this device reads their own dismissal.
  return <Banner key={user.uid} uid={user.uid} dismissable={dismissable} />;
}

function Banner({ uid, dismissable }: { uid: string; dismissable: boolean }) {
  const [snoozed, setSnoozed] = useState(
    () =>
      dismissable &&
      isVerifyBannerSnoozed(readVerifyBannerDismissal(uid), new Date()),
  );
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (snoozed) return null;

  const resend = async () => {
    setError(null);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    try {
      await sendVerificationEmail();
      setSent(true);
    } catch (e) {
      setSent(false);
      setCooldown(0);
      setError(toUserMessage(e));
    }
  };

  const dismiss = () => {
    writeVerifyBannerDismissal(uid, new Date());
    setSnoozed(true);
  };

  return (
    <div
      role="status"
      className="border-b bg-secondary px-4 py-3 text-sm text-secondary-foreground"
    >
      <div className="mx-auto flex max-w-(--breakpoint-2xl) flex-col gap-2 sm:flex-row sm:items-center">
        <p className="flex-1">
          Verify your email to keep your account safe. Contacts others added
          with this email join your account once you do.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={resend}
            disabled={cooldown > 0}
          >
            Resend email
          </Button>
          {dismissable ? (
            <Button size="sm" onClick={dismiss}>
              Dismiss
            </Button>
          ) : null}
        </div>
      </div>
      {sent && cooldown > 0 ? (
        <p className="mx-auto mt-2 max-w-(--breakpoint-2xl)">
          Sent. Check your inbox.
        </p>
      ) : null}
      {error ? (
        <p className="mx-auto mt-2 max-w-(--breakpoint-2xl) text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
