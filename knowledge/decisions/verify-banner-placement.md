---
type: Decision
title: Verify-email banner on Groups and Profile only, dismissable for 7 days
description: The verify-email banner shows on Groups until dismissed (again after 7 days) and always on Profile; it has no "I've verified" button and no re-check on focus.
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-06T18:00:00Z
status: draft
---

# Verify-email banner on Groups and Profile only, dismissable for 7 days

## Context

The banner sat in the signed-in shell, above every screen, with Resend email and "I've verified". The developer
answered on 2026-11-06 that it should show on Groups with a way to dismiss it, and on Profile.

## Decision

- Groups shows it with Resend email and Dismiss. A dismissal hides it for 7 days (`VERIFY_BANNER_SNOOZE_DAYS`): hidden
  only while `0 <= now - dismissedAt < 7 days`. A future-dated value, or any text that isn't exactly what
  `writeVerifyBannerDismissal` writes (an ISO string), shows it, so no stored value can hide it for more than 7 days.
- The date is kept per person in localStorage under `splitify:verify-banner-dismissed:<uid>`
  (`lib/auth/verify-banner-dismissal.ts`), so a shared device keeps people apart. Blocked storage means the banner
  hides for that visit only, and the failed read or write logs `console.warn("[verify-banner] read|write failed", <class>)`
  ([the fixed finding](../findings/verify-banner-storage-failures-are-silent.md)).
- Profile always shows it, with Resend only.
- No other screen shows it, and "I've verified" is gone: once the email is verified the banner clears on the next token
  refresh or sign-in (`onUserChanged` is built on `onIdTokenChanged`). There is no re-check on window focus.

## Consequences

- Someone who verifies in another tab sees the banner until their token refreshes (up to an hour) or they sign in again.
- A person whose clock moves back sees the banner again after dismissing it.

## History

- 2026-11-06: a storage failure was swallowed silently; now it logs a warning with the error's class, because the banner returning each visit had nothing in the console to explain it. The decision itself is unchanged.

## Sources

- `components/auth/verify-email-banner.tsx`
- `lib/auth/verify-banner-dismissal.ts`
- `app/(platform)/(app)/(screens)/groups/page.tsx`
- `app/(platform)/profile/page.tsx`
- `lib/firebase/auth.ts`
