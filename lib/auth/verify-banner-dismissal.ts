/** How long a dismissed verify-email banner stays hidden on Groups. */
export const VERIFY_BANNER_SNOOZE_DAYS = 7;

const SNOOZE_MS = VERIFY_BANNER_SNOOZE_DAYS * 24 * 60 * 60 * 1000;

/** The localStorage key holding when this person dismissed the banner, one per person so a shared device keeps them apart. */
export function verifyBannerKey(uid: string): string {
  return `splitify:verify-banner-dismissed:${uid}`;
}

/**
 * Whether a stored dismissal still hides the banner: only while `0 <= now - dismissed < 7 days`. A dismissal dated in
 * the future (the clock was moved back, or the value was edited) is invalid and shows the banner, so no value hides it
 * for more than 7 days from now. Only a value exactly as `writeVerifyBannerDismissal` writes it counts: nothing stored,
 * or any other text, even one `Date.parse` reads, never hides it.
 */
export function isVerifyBannerSnoozed(
  stored: string | null,
  now: Date,
): boolean {
  if (!stored) return false;
  const dismissedAt = new Date(stored);
  if (Number.isNaN(dismissedAt.getTime())) return false;
  if (dismissedAt.toISOString() !== stored) return false;
  const age = now.getTime() - dismissedAt.getTime();
  return age >= 0 && age < SNOOZE_MS;
}

/** The stored dismissal for this person, or null when none is stored or storage is blocked. */
export function readVerifyBannerDismissal(uid: string): string | null {
  try {
    return localStorage.getItem(verifyBannerKey(uid));
  } catch {
    return null;
  }
}

/** Stores `now` as this person's dismissal; does nothing when storage is blocked or full. */
export function writeVerifyBannerDismissal(uid: string, now: Date): void {
  try {
    localStorage.setItem(verifyBannerKey(uid), now.toISOString());
  } catch {
    // Storage is blocked or full: the banner hides for this visit only and shows again next time.
  }
}
