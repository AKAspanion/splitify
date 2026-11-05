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
