"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  googleRedirectPending,
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/firebase/auth";
import { authErrorMessage } from "@/lib/auth/auth-errors";
import {
  finishGoogleReturn,
  whenRestoredAfterGoogle,
} from "@/lib/auth/google-return";
import { safeNextPath } from "@/lib/auth/next-path";
import { OfflineSignInNote } from "@/components/offline/offline-sign-in-note";
import { useOnline } from "@/hooks/use-online";
import { AuthCard } from "../_components/auth-card";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const next = safeNextPath(rawNext);
  const { status } = useAuth();
  const online = useOnline();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Back from Google, the form starts loading. useSearchParams keeps this form out of the prerendered HTML (it renders
  // in the browser only), so reading sessionStorage here can't differ from a server render.
  const [pending, setPending] = useState<"email" | "google" | null>(() =>
    googleRedirectPending() ? "google" : null,
  );
  const [error, setError] = useState<string | null>(null);
  // The email fields open behind a button, so the card first offers only the two ways in.
  const [showEmail, setShowEmail] = useState(false);

  // Someone already signed in has no use for the form. A sign-in in flight finishes (UpsertMe) before it navigates.
  // After a failed Google sign-in the form stays, with its error: Auth may still report the user it couldn't sign out.
  useEffect(() => {
    if (status === "signed-in" && !pending && !error) router.replace(next);
  }, [status, pending, error, next, router]);

  // Back from Google: finish the sign-in (UpsertMe) before going on.
  useEffect(() => {
    if (!googleRedirectPending()) return;
    let active = true;
    void finishGoogleReturn().then((result) => {
      if (!active) return;
      if (result.kind === "signed-in") router.replace(next);
      else {
        if (result.kind === "failed") setError(result.message);
        setPending(null);
      }
    });
    return () => {
      active = false;
    };
  }, [next, router]);

  // Back from Google's page without signing in, the browser may restore this page as it was left: button loading.
  useEffect(() => {
    if (pending !== "google") return;
    return whenRestoredAfterGoogle(() => setPending(null));
  }, [pending]);

  const signInEmail = async () => {
    setPending("email");
    setError(null);
    try {
      await signInWithEmail(email, password);
      router.replace(next);
    } catch (e) {
      setError(authErrorMessage(e));
      setPending(null);
    }
  };

  // The page leaves for Google, so the button stays loading; it comes back here only if the redirect fails to start.
  const google = async () => {
    setPending("google");
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(authErrorMessage(e));
      setPending(null);
    }
  };

  const query = rawNext ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <AuthCard
      subtitle="Sign in to split expenses with friends"
      footer={
        <>
          <p className="text-muted-foreground">
            New to Splitify?{" "}
            <Link
              href={`/sign-up/${query}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
          <Link
            href="/privacy/"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Privacy policy
          </Link>
        </>
      }
    >
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending !== null || !online}
        loading={pending === "google"}
        onClick={() => void google()}
      >
        Continue with Google
      </Button>
      {showEmail ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void signInEmail();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
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
          <Button
            type="submit"
            className="w-full"
            disabled={pending !== null || !online}
            loading={pending === "email"}
          >
            Sign in
          </Button>
          <p className="text-center text-sm">
            <Link
              href="/forgot-password/"
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </p>
        </form>
      ) : (
        <Button
          type="button"
          className="w-full"
          disabled={pending !== null || !online}
          onClick={() => setShowEmail(true)}
        >
          Sign in with email
        </Button>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive dark:text-red-400">
          {error}
        </p>
      ) : null}
      <OfflineSignInNote />
    </AuthCard>
  );
}
