"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendPasswordReset } from "@/lib/firebase/auth";
import { authErrorMessage } from "@/lib/auth/auth-errors";
import { OfflineSignInNote } from "@/components/offline/offline-sign-in-note";
import { useOnline } from "@/hooks/use-online";
import { AuthCard } from "../_components/auth-card";

export function ForgotPasswordForm() {
  const online = useOnline();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      // The answer never says whether the email has an account.
      const code = (e as { code?: unknown } | null)?.code;
      if (code === "auth/user-not-found") setSent(true);
      else setError(authErrorMessage(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthCard
      subtitle="Reset your password"
      footer={
        <Link
          href="/sign-in/"
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {sent ? (
          <p role="status" className="text-sm text-muted-foreground">
            If an account exists for that email, a reset link is on its way.
          </p>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="text-sm text-destructive dark:text-red-400"
          >
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full"
          disabled={pending || !online}
          loading={pending}
        >
          Send reset link
        </Button>
        <OfflineSignInNote />
      </form>
    </AuthCard>
  );
}
