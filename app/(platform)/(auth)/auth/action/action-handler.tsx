"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Header } from "@/components/container/header";
import { buttonVariants } from "@/components/ui/button";
import {
  ACTION_PATH,
  parseActionLink,
  type ActionLink,
} from "@/lib/auth/action-link";
import { cn } from "@/lib/utils";
import { ResetPasswordForm } from "./reset-password-form";
import { VerifyEmailResult } from "./verify-email-result";

/** The parts of `window` the handler uses, so a test can hand it a fake. */
export type ActionWindow = {
  location: Pick<Location, "search" | "replace">;
  history: Pick<History, "replaceState">;
};

/**
 * Reads the email link, takes it out of the address bar at once so the one-time code doesn't stay in the URL or the
 * history, and sends the modes Firebase finishes on to Firebase's own handler.
 */
export function openActionLink(win: ActionWindow): ActionLink {
  const link = parseActionLink(win.location.search);
  win.history.replaceState(null, "", ACTION_PATH);
  if (link.kind === "firebase") win.location.replace(link.forwardTo);
  return link;
}

/** The link this document opened with. A module lives as long as the document, so a reload starts it again. */
let openedLink: ActionLink | undefined;

/**
 * Opens the link the first time a handler mounts in this document, and gives every later mount the same link. A
 * handler can mount more than once in a load: signed in, the providers remount the page once auth is restored
 * (`QueryProvider` is keyed by the person), and Strict Mode renders twice. Each later mount would otherwise find the
 * address bar already clean and call the link incomplete. The same link each time, so React sees no change.
 */
export function readActionLinkOnce(win: ActionWindow): ActionLink {
  openedLink ??= openActionLink(win);
  return openedLink;
}

function titleFor(link: ActionLink | null): string {
  if (link?.kind === "reset-password") return "Choose a new password";
  if (link?.kind === "verify-email") return "Verify your email";
  return "Email link";
}

/** The link never changes once read, so there is nothing to subscribe to. */
const noSubscription = () => () => {};

export function ActionHandler() {
  // The page is prerendered, so while prerendering and hydrating there is no link yet; then React reads the
  // document's link, once per document (readActionLinkOnce), and every later mount gets the same one at once.
  const link = useSyncExternalStore<ActionLink | null>(
    noSubscription,
    () => readActionLinkOnce(window),
    () => null,
  );

  return (
    <>
      <div className="p-6 w-full">
        <Header title={titleFor(link)} />
      </div>
      <div className="flex w-full justify-center px-6 pb-12">
        <div className="w-full max-w-sm space-y-6">
          <ActionBody link={link} />
        </div>
      </div>
    </>
  );
}

function ActionBody({ link }: { link: ActionLink | null }) {
  if (link?.kind === "reset-password")
    return <ResetPasswordForm code={link.code} />;
  if (link?.kind === "verify-email")
    return <VerifyEmailResult code={link.code} />;
  if (link?.kind === "incomplete") {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm">
          This link isn&apos;t complete. Open it again from the email.
        </p>
        <Link href="/sign-in/" className={cn(buttonVariants(), "w-full")}>
          Back to sign in
        </Link>
      </div>
    );
  }
  // Not read yet, or on its way to Firebase's own handler.
  return (
    <p role="status" className="text-sm text-muted-foreground">
      Checking your link…
    </p>
  );
}
