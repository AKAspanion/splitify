let signOutIntended = false;

/** Marks a sign-out the person asked for, so the auth guard sends them home rather than to sign in. */
export function markSignOutIntended(intended: boolean): void {
  signOutIntended = intended;
}

export function isSignOutIntended(): boolean {
  return signOutIntended;
}

/** Where the guard sends a signed-out person: home after a sign-out they chose, otherwise to sign in and back. */
export function signedOutDestination(
  pathname: string,
  intended: boolean,
): string {
  return intended ? "/" : `/sign-in/?next=${encodeURIComponent(pathname)}`;
}

/**
 * Leaves for the sign-in screen by a full page load, never the router: after a sign-out or an account deletion the
 * person must not see a signed-in screen, and a fresh document drops every signed-in screen's state with it.
 */
export function leaveForSignIn(): void {
  window.location.replace("/sign-in/");
}
