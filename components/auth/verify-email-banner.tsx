"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toUserMessage } from "@/lib/data/errors";
import {
  reloadEmailVerified,
  sendVerificationEmail,
} from "@/lib/firebase/auth";

const RESEND_COOLDOWN_SECONDS = 60;

/** Shown while the signed-in person's email is unverified: resend the email, or reload to check. */
export function VerifyEmailBanner() {
  const { status, user } = useAuth();
  const [verified, setVerified] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (status !== "signed-in" || !user || user.emailVerified || verified)
    return null;

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

  const check = async () => {
    setError(null);
    setChecking(true);
    try {
      if (await reloadEmailVerified()) setVerified(true);
      else setError("Not verified yet. Open the link in the email first.");
    } catch (e) {
      setError(toUserMessage(e));
    } finally {
      setChecking(false);
    }
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
          <Button size="sm" onClick={check} disabled={checking}>
            I&apos;ve verified
          </Button>
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
