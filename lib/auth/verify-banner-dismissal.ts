/** How long a dismissed verify-email banner stays hidden on Groups. */
export const VERIFY_BANNER_SNOOZE_DAYS = 7;

const SNOOZE_MS = VERIFY_BANNER_SNOOZE_DAYS * 24 * 60 * 60 * 1000;

/** The localStorage key holding when this person dismissed the banner, one per person so a shared device keeps them apart. */
export function verifyBannerKey(uid: string): string {
  return `splitify:verify-banner-dismissed:${uid}`;
}

/**
 * Whether a stored dismissal still hides the banner: it does for less than 7 days either side of `now` (a clock moved
 * back leaves a date in the future, which only hides it while it is under 7 days ahead). Nothing stored, or text that
 * isn't a date, never hides it.
 */
export function isVerifyBannerSnoozed(
  stored: string | null,
  now: Date,
): boolean {
  if (!stored) return false;
  const dismissedAt = Date.parse(stored);
  if (Number.isNaN(dismissedAt)) return false;
  return Math.abs(now.getTime() - dismissedAt) < SNOOZE_MS;
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
