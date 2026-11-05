"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { verifyEmailWithCode } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils";
import { callWithCode, newCodeAttempts, type CodeAttempts } from "./code-call";

/**
 * What applying a verify-email link came to. `maybe-done`: refused as spent after an earlier attempt lost its reply,
 * so the email may already be verified.
 */
export type VerifyResult =
  | { kind: "verified" }
  | { kind: "spent" }
  | { kind: "maybe-done" }
  | { kind: "failed"; message: string };

/** Applies the link's code. `attempts` is the page's own, kept across tries. */
export async function verifyEmailLink(
  code: string,
  attempts: CodeAttempts,
): Promise<VerifyResult> {
  const result = await callWithCode(
    "Verify email: applying the link failed",
    () => verifyEmailWithCode(code),
    attempts,
  );
  return result.kind === "done" ? { kind: "verified" } : result;
}

export function VerifyEmailResult({ code }: { code: string }) {
  const attempts = useRef<CodeAttempts>(newCodeAttempts());
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
      call.current = {
        code,
        attempt,
        result: verifyEmailLink(code, attempts.current),
      };
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

  if (result.kind === "maybe-done") {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm">
          Your email may already be verified. Continue to Splitify to check.
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
