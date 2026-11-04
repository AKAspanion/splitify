"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { signInWithEmail, signInWithGoogle } from "@/lib/firebase/auth";
import { authErrorMessage } from "@/lib/auth/auth-errors";
import { safeNextPath } from "@/lib/auth/next-path";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const next = safeNextPath(rawNext);
  const { status } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Someone already signed in has no use for the form. A sign-in in flight finishes (UpsertMe) before it navigates.
  useEffect(() => {
    if (status === "signed-in" && !pending) router.replace(next);
  }, [status, pending, next, router]);

  const run = async (kind: "email" | "google", action: () => Promise<void>) => {
    setPending(kind);
    setError(null);
    try {
      await action();
      router.replace(next);
    } catch (e) {
      setError(authErrorMessage(e));
      setPending(null);
    }
  };

  const query = rawNext ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="w-full max-w-sm space-y-6">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void run("email", () => signInWithEmail(email, password));
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
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
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
          disabled={pending !== null}
          loading={pending === "email"}
        >
          Sign in
        </Button>
      </form>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending !== null}
        loading={pending === "google"}
        onClick={() => void run("google", signInWithGoogle)}
      >
        Continue with Google
      </Button>
      <div className="flex flex-col items-center gap-2 text-sm">
        <Link
          href="/forgot-password/"
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          Forgot your password?
        </Link>
        <p className="text-muted-foreground">
          New to Splitify?{" "}
          <Link
            href={`/sign-up/${query}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
