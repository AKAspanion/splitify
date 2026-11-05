"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readPasswordResetEmail, resetPassword } from "@/lib/firebase/auth";
import { OfflineSignInNote } from "@/components/offline/offline-sign-in-note";
import { useOnline } from "@/hooks/use-online";
import { cn } from "@/lib/utils";
import { callWithCode, newCodeAttempts, type CodeAttempts } from "./code-call";

/** The sign-up rule; Firebase's own minimum (6) is below it. */
const MIN_PASSWORD_LENGTH = 8;

/** What checking a reset link found. */
export type ResetLinkCheck =
  | { kind: "ready"; email: string }
  | { kind: "spent" }
  | { kind: "failed"; message: string };

/**
 * What saving the new password came to. A failure keeps the form, with its message. `maybe-done`: refused as spent
 * after an earlier save lost its reply, so the password may already be changed.
 */
export type SaveResult =
  | { kind: "saved" }
  | { kind: "spent" }
  | { kind: "maybe-done" }
  | { kind: "failed"; message: string };

/** Asks Firebase whose reset link this is. Reading doesn't spend the code, so no attempts are kept. */
export async function checkResetLink(code: string): Promise<ResetLinkCheck> {
  const result = await callWithCode(
    "Reset password: checking the link failed",
    () => readPasswordResetEmail(code),
  );
  if (result.kind === "done") return { kind: "ready", email: result.value };
  if (result.kind === "maybe-done") return { kind: "spent" };
  return result;
}

/**
 * Sets the new password. One shorter than the sign-up rule is refused here, before Firebase is asked. `attempts` is
 * the page's own, kept across saves.
 */
export async function saveNewPassword(
  code: string,
  password: string,
  attempts: CodeAttempts,
): Promise<SaveResult> {
  if (password.length < MIN_PASSWORD_LENGTH)
    return { kind: "failed", message: "Use at least 8 characters." };
  const result = await callWithCode(
    "Reset password: saving the new password failed",
    () => resetPassword(code, password),
    attempts,
  );
  return result.kind === "done" ? { kind: "saved" } : result;
}

type Phase =
  | { kind: "checking" }
  | ResetLinkCheck
  | { kind: "saved" }
  | { kind: "maybe-done" };

export function ResetPasswordForm({ code }: { code: string }) {
  const online = useOnline();
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "checking" });
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attempts = useRef<CodeAttempts>(newCodeAttempts());

  // Checking reads the code without spending it, so Strict Mode's second run only asks again.
  useEffect(() => {
    let active = true;
    void checkResetLink(code).then((result) => {
      if (active) setPhase(result);
    });
    return () => {
      active = false;
    };
  }, [code, attempt]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    const result = await saveNewPassword(code, password, attempts.current);
    setSaving(false);
    if (result.kind === "failed") setError(result.message);
    else setPhase(result);
  };

  if (phase.kind === "checking") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Checking your link…
      </p>
    );
  }

  if (phase.kind === "spent") {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm">
          This link has expired or was already used.
        </p>
        <Link
          href="/forgot-password/"
          className={cn(buttonVariants(), "w-full")}
        >
          Ask for a new link
        </Link>
      </div>
    );
  }

  if (phase.kind === "maybe-done") {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm">
          Your password may already be changed. Try signing in with your new
          password, or ask for a new link.
        </p>
        <Link href="/sign-in/" className={cn(buttonVariants(), "w-full")}>
          Sign in
        </Link>
        <Link
          href="/forgot-password/"
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          Ask for a new link
        </Link>
      </div>
    );
  }

  if (phase.kind === "failed") {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm text-destructive dark:text-red-400">
          {phase.message}
        </p>
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            setPhase({ kind: "checking" });
            setAttempt((n) => n + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (phase.kind === "saved") {
    return (
      <div className="space-y-4">
        <p role="status" className="text-sm">
          Your password is changed. Sign in with your new password.
        </p>
        <Link href="/sign-in/" className={cn(buttonVariants(), "w-full")}>
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="text-sm text-muted-foreground">For {phase.email}</p>
      {/* Lets a password manager save the new password against the right account. */}
      <input
        type="email"
        name="email"
        autoComplete="username"
        value={phase.email}
        readOnly
        hidden
      />
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive dark:text-red-400">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full"
        disabled={saving || !online}
        loading={saving}
      >
        Save password
      </Button>
      <OfflineSignInNote />
    </form>
  );
}
