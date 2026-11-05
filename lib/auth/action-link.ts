/** The app's own page for Firebase's email action links (reset password, verify email). */
export const ACTION_PATH = "/auth/action/";
/** Firebase Hosting's own action handler, for the modes the app leaves to Firebase. */
export const FIREBASE_ACTION_HANDLER = "/__/auth/action";

export type ActionLink =
  | { kind: "reset-password"; code: string }
  | { kind: "verify-email"; code: string }
  | { kind: "firebase"; forwardTo: string } // FIREBASE_ACTION_HANDLER + the link's own query string, unchanged
  | { kind: "incomplete" };

/** The modes Firebase's own handler finishes; the app has no screen for them. */
const FORWARDED_MODES: ReadonlySet<string> = new Set([
  "recoverEmail",
  "verifyAndChangeEmail",
  "revertSecondFactorAddition",
]);

/**
 * Reads a Firebase email action link's query string (with or without its leading "?"). Only `mode` and `oobCode` are
 * read: `continueUrl` and every other parameter are ignored, and never followed. A link without both, or with a mode
 * Firebase doesn't send, is incomplete. A forwarded link keeps its query as it came, after Firebase's own handler's
 * fixed path, so nothing in it can change where it goes.
 */
export function parseActionLink(search: string): ActionLink {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  const mode = params.get("mode");
  const code = params.get("oobCode")?.trim();
  if (!mode || !code) return { kind: "incomplete" };
  if (mode === "resetPassword") return { kind: "reset-password", code };
  if (mode === "verifyEmail") return { kind: "verify-email", code };
  if (FORWARDED_MODES.has(mode))
    return {
      kind: "firebase",
      forwardTo: `${FIREBASE_ACTION_HANDLER}?${query}`,
    };
  return { kind: "incomplete" };
}
