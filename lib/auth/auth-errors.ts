const MISMATCH = "That email and password don't match.";
const NO_GOOGLE =
  "Google sign-in isn't available here. Use email and password.";

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
};

/** What a person sees for a failed sign-in, never Firebase's own message. */
export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code: unknown }).code
      : undefined;
  if (typeof code === "string" && Object.hasOwn(MESSAGES, code))
    return MESSAGES[code];
  return "Something went wrong. Try again.";
}
