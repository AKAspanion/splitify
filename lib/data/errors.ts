// People-facing text for a failed data-layer call. Firebase and SQL error text never reaches the screen:
// only the `@check` messages the connectors define are passed on, the rest become one of three fixed lines.

/** The `@check` messages in dataconnect/ that a person may read as they are. */
const CHECK_MESSAGES = [
  "Not found",
  "Only members of this group can be added to an expense",
  "That email is already in use",
  "You can only add your friends to a group",
  "That request is too large.",
  // deleteMyAccount's answer to a sign-in older than 5 minutes (functions/src/account/delete-my-account.ts).
  "Sign in again to delete your account.",
] as const;

const SIGN_IN_AGAIN = "Sign in again to continue.";
const OFFLINE = "Couldn't reach Splitify. Check your connection.";
const GENERIC = "Something went wrong. Try again.";

const readField = (error: unknown, key: "code" | "message"): string => {
  if (typeof error !== "object" || error === null) return "";
  const value = (error as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
};

export function toUserMessage(error: unknown): string {
  const message = readField(error, "message");
  const code = readField(error, "code");

  const check = CHECK_MESSAGES.find((text) => message.includes(text));
  if (check) return check;

  if (
    code === "unauthorized" ||
    code === "unauthenticated" ||
    code === "auth/user-token-expired" ||
    /unauthenticated|unauthorized|permission denied/i.test(message)
  )
    return SIGN_IN_AGAIN;

  if (
    code === "auth/network-request-failed" ||
    code === "unavailable" ||
    /failed to fetch|fetch failed|network|load failed|offline/i.test(message)
  )
    return OFFLINE;

  return GENERIC;
}
