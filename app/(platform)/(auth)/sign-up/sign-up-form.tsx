"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth";
import { authErrorMessage } from "@/lib/auth/auth-errors";
import { safeNextPath } from "@/lib/auth/next-path";

const MIN_PASSWORD_LENGTH = 8;

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const next = safeNextPath(rawNext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const submit = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("Use at least 8 characters.");
      return;
    }
    setPending("email");
    setError(null);
    try {
      await signUpWithEmail(email, password, name);
      setCreated(true);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setPending(null);
    }
  };

  const google = async () => {
    setPending("google");
    setError(null);
    try {
      await signInWithGoogle();
      router.replace(next);
    } catch (e) {
      setError(authErrorMessage(e));
      setPending(null);
    }
  };

  if (created) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <p role="status" className="text-sm text-muted-foreground">
          Check your inbox to verify your email. You can start using Splitify
          now.
        </p>
        <Button className="w-full" onClick={() => router.replace(next)}>
          Continue
        </Button>
      </div>
    );
  }

  const query = rawNext ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="w-full max-w-sm space-y-6">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
            autoComplete="new-password"
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
          Create account
        </Button>
      </form>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending !== null}
        loading={pending === "google"}
        onClick={() => void google()}
      >
        Continue with Google
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/sign-in/${query}`}
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
