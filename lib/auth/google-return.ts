import { clearGoogleRedirect, completeGoogleSignIn } from "@/lib/firebase/auth";
import { authErrorMessage } from "./auth-errors";

/** What a form does once the page loads: finish a Google redirect, if one is coming back. */
export type GoogleReturn =
  | { kind: "none" }
  | { kind: "signed-in" }
  | { kind: "failed"; message: string };

/** Firebase's error code, or the error's class when it has none: never its message, which can carry the email. */
function failureCause(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return error instanceof Error ? error.name : typeof error;
}

/** Runs completeGoogleSignIn and turns its outcome into the form's next step; never rejects. */
export async function finishGoogleReturn(): Promise<GoogleReturn> {
  try {
    return (await completeGoogleSignIn())
      ? { kind: "signed-in" }
      : { kind: "none" };
  } catch (error) {
    console.warn(
      "Google sign-in: completing the redirect failed",
      failureCause(error),
    );
    return { kind: "failed", message: authErrorMessage(error) };
  }
}

/**
 * While the page is leaving for Google: when the browser restores it from its back/forward cache instead (the person
 * pressed Back), clears the redirect marker and calls onRestore, so the form can be used at once. Returns the function
 * that stops listening.
 */
export function whenRestoredAfterGoogle(onRestore: () => void): () => void {
  const listener = (event: PageTransitionEvent) => {
    if (!event.persisted) return;
    clearGoogleRedirect();
    onRestore();
  };
  window.addEventListener("pageshow", listener);
  return () => window.removeEventListener("pageshow", listener);
}
