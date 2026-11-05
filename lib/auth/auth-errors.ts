const MISMATCH = "That email and password don't match.";
const NO_GOOGLE =
  "Google sign-in isn't available here. Use email and password.";
const GOOGLE_CLOSED = "Google sign-in was closed before it finished.";
const LINK_SPENT = "This link has expired or was already used.";

const MESSAGES: Record<string, string> = {
  "auth/wrong-password": MISMATCH,
  "auth/user-not-found": MISMATCH,
  "auth/invalid-credential": MISMATCH,
  "auth/email-already-in-use":
    "An account with that email already exists. Sign in instead.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Try again in a few minutes.",
  "auth/network-request-failed":
    "Couldn't reach Splitify. Check your connection.",
  "auth/popup-blocked": NO_GOOGLE,
  "auth/operation-not-supported-in-this-environment": NO_GOOGLE,
  // The site's domain isn't in Firebase Auth's authorized domains.
  "auth/unauthorized-domain": NO_GOOGLE,
  // No sessionStorage (blocked, or a private mode that refuses it): the redirect couldn't finish.
  "auth/web-storage-unsupported": NO_GOOGLE,
  "auth/popup-closed-by-user": GOOGLE_CLOSED,
  "auth/cancelled-popup-request": GOOGLE_CLOSED,
  // A reset or verify-email link's one-time code: past its time, already used, or not a code at all.
  "auth/expired-action-code": LINK_SPENT,
  "auth/invalid-action-code": LINK_SPENT,
  // The sign-up rule, which Firebase's own minimum (6) is below.
  "auth/weak-password": "Use at least 8 characters.",
  "auth/user-disabled": "This account is turned off.",
};

/** A Firebase error's code (`auth/...`), the cause class a log may carry; undefined for anything else. */
export function authErrorCode(error: unknown): string | undefined {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code: unknown }).code
      : undefined;
  return typeof code === "string" ? code : undefined;
}

/** True when an email link's one-time code can't be used again: past its time, already used, or not a code. */
export function isSpentActionCode(error: unknown): boolean {
  const code = authErrorCode(error);
  return (
    code === "auth/expired-action-code" || code === "auth/invalid-action-code"
  );
}

/** What a person sees for a failed sign-in, never Firebase's own message. */
export function authErrorMessage(error: unknown): string {
  const code = authErrorCode(error);
  if (code !== undefined && Object.hasOwn(MESSAGES, code))
    return MESSAGES[code];
  return "Something went wrong. Try again.";
}
