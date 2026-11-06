"use client";

import { useEffect, useState } from "react";
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

/** A verify code's latest attempt in this document: the call, its outcome once settled, and its attempts record. */
type VerifyCall = {
  attempts: CodeAttempts;
  result: Promise<VerifyResult>;
  settled?: VerifyResult;
};

/**
 * Each code's latest attempt, kept for the document's life rather than in the component: applying spends the code,
 * and the handler can mount more than once in a load (the providers remount the page once auth is restored, and
 * Strict Mode runs effects twice). A remount that applied the code again would show a spent link for an email it had
 * just verified.
 */
const verifyCalls = new Map<string, VerifyCall>();

function startVerify(code: string, attempts: CodeAttempts): VerifyCall {
  const call: VerifyCall = {
    attempts,
    result: verifyEmailLink(code, attempts).then((result) => {
      call.settled = result;
      return result;
    }),
  };
  verifyCalls.set(code, call);
  return call;
}

/** The outcome of applying this code in this document: the first call applies it, every later one shares it. */
export function verifyLinkOnce(code: string): Promise<VerifyResult> {
  return (verifyCalls.get(code) ?? startVerify(code, newCodeAttempts())).result;
}

/**
 * A new attempt, for Try again after a failure: applies the code again, with the attempts record the earlier ones
 * kept. While a call is in flight, or once one has an outcome other than a failure, it is shared instead.
 */
export function retryVerifyLink(code: string): Promise<VerifyResult> {
  const call = verifyCalls.get(code);
  if (!call) return verifyLinkOnce(code);
  if (call.settled?.kind !== "failed") return call.result;
  return startVerify(code, call.attempts).result;
}

export function VerifyEmailResult({ code }: { code: string }) {
  // Bumped by Try again, which has already started the new attempt (retryVerifyLink).
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<VerifyResult | null>(null);

  // Every mount shows the code's latest attempt in this document, applying it only if none was made yet.
  useEffect(() => {
    let active = true;
    void verifyLinkOnce(code).then((next) => {
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

  if (result.kind === "verified") return <VerifyVerified />;

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
    <VerifyFailed
      message={result.message}
      onRetry={() => {
        void retryVerifyLink(code);
        setResult(null);
        setAttempt((n) => n + 1);
      }}
    />
  );
}

/** Applying the link failed: the message, Try again, and a way out. */
export function VerifyFailed({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-4">
      <p role="alert" className="text-sm text-destructive dark:text-red-400">
        {message}
      </p>
      <Button type="button" className="w-full" onClick={onRetry}>
        Try again
      </Button>
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        Go home
      </Link>
    </div>
  );
}

/** The email is verified: Continue into the app. */
export function VerifyVerified() {
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
