import {
  authErrorCode,
  authErrorMessage,
  isSpentActionCode,
} from "@/lib/auth/auth-errors";

/**
 * What a call with an email link's one-time code came to. `maybe-done`: refused as spent, after an earlier call from
 * this page lost its reply, so that call may have gone through and spent the code itself.
 */
export type CodeCallResult<T> =
  | { kind: "done"; value: T }
  | { kind: "spent" }
  | { kind: "maybe-done" }
  | { kind: "failed"; message: string };

/** What one page instance remembers of its calls that spend the code. */
export type CodeAttempts = { replyLost: boolean };

export function newCodeAttempts(): CodeAttempts {
  return { replyLost: false };
}

/**
 * Makes a call with the link's code and reads its failure in the app's own words. The failure is logged as `what`
 * with its cause class only, never the code. A call that spends the code passes the page's `attempts`, so a spent
 * answer after a lost reply reads as `maybe-done`; a call that only reads the code passes none.
 */
export async function callWithCode<T>(
  what: string,
  call: () => Promise<T>,
  attempts?: CodeAttempts,
): Promise<CodeCallResult<T>> {
  try {
    return { kind: "done", value: await call() };
  } catch (error) {
    const code = authErrorCode(error);
    console.warn(what, code ?? "no code");
    if (isSpentActionCode(error))
      return attempts?.replyLost ? { kind: "maybe-done" } : { kind: "spent" };
    // The request may have reached Firebase and spent the code before the reply was lost.
    if (attempts && code === "auth/network-request-failed")
      attempts.replyLost = true;
    return { kind: "failed", message: authErrorMessage(error) };
  }
}
