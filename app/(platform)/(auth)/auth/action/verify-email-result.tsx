"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { verifyEmailWithCode } from "@/lib/firebase/auth";
import {
  authErrorCode,
  authErrorMessage,
  isSpentActionCode,
} from "@/lib/auth/auth-errors";
import { cn } from "@/lib/utils";

/** What applying a verify-email link came to. */
export type VerifyResult =
  | { kind: "verified" }
  | { kind: "spent" }
  | { kind: "failed"; message: string };

/** Applies the link's code. A failure logs its cause class only, never the code. */
export async function verifyEmailLink(code: string): Promise<VerifyResult> {
  try {
    await verifyEmailWithCode(code);
    return { kind: "verified" };
  } catch (error) {
    console.warn(
      "Verify email: applying the link failed",
      authErrorCode(error) ?? "no code",
    );
    if (isSpentActionCode(error)) return { kind: "spent" };
    return { kind: "failed", message: authErrorMessage(error) };
  }
}

export function VerifyEmailResult({ code }: { code: string }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const call = useRef<{
    code: string;
    attempt: number;
    result: Promise<VerifyResult>;
  } | null>(null);

  // Applying spends the code, so it is asked once per attempt: Strict Mode's second run reuses the first run's call
  // rather than applying a spent code and showing it as used.
  useEffect(() => {
    if (call.current?.code !== code || call.current.attempt !== attempt)
      call.current = { code, attempt, result: verifyEmailLink(code) };
    let active = true;
    void call.current.result.then((next) => {
      if (active) setResult(next);
    });
    return () => {
      active = false;
    };
  }, [code, attempt]);

  if (result === null) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Checking your link…
      </p>
    );
  }

  if (result.kind === "verified") {
    return (
      <div className="space-y-4">
        <p role="status" className="text-sm">
          Your email is verified.
        </p>
        <Link href="/groups/" className={cn(buttonVariants(), "w-full")}>
          Continue
        </Link>
      </div>
    );
  }

  if (result.kind === "spent") {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm">
          This link has expired or was already used.
        </p>
        <Link href="/groups/" className={cn(buttonVariants(), "w-full")}>
          Go to Splitify
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p role="alert" className="text-sm text-destructive dark:text-red-400">
        {result.message}
      </p>
      <Button
        type="button"
        className="w-full"
        onClick={() => {
          setResult(null);
          setAttempt((n) => n + 1);
        }}
      >
        Try again
      </Button>
    </div>
  );
}
