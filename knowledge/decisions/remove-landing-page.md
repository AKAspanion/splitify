---
type: Decision
title: Remove the landing page; / redirects by sign-in state
description: The marketing landing page is removed; / sends a signed-in person to /groups/ and everyone else to /sign-in/, and the sign-in screens are one centred card.
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-06T18:00:00Z
status: draft
---

# Remove the landing page; / redirects by sign-in state

## Context

The landing page (`app/(landing)`, with its navbar and footer) was the signed-out home. On 2026-11-06 the developer
asked to remove it and to lay the sign-in screens out like todo.spanion.in: one centred card.

## Decision

- There is no landing page. `/` is `HomeRedirect` (`app/(platform)/(auth)/home-redirect.tsx`), which leaves by
  `window.location.replace` to `/groups/` when signed in and `/sign-in/` when signed out, and shows a spinner until
  Auth reports a status.
- Sign-in, sign-up and forgot-password share one centred `AuthCard`; email sign-in opens behind a "Sign in with
  email" button. The card has no theme toggle: the screens follow the system or saved theme (the developer's
  correction, 2026-11-06).
- A sign-out and a successful account deletion sign out first, then leave for `/sign-in/` by a full page load
  (`leaveForSignIn` in `lib/auth-redirect.ts`), not for `/`: `/` still saw the person as signed in and flashed
  `/groups/`, and a fresh document drops every signed-in screen's state and any ad script.

## Consequences

- The ad script no longer has a landing page to load on ([the AdSense decision](adsense-on-privacy-and-delete-account-pages.md)).
- `RequireAuth` still sends a signed-out person home (`/`) after a sign-out they chose, and `/` then redirects to
  sign-in.
- The hosting check (`scripts/hosting-pages/public.json`) expects the redirect page's own text for `/`.

## Sources

- `app/(platform)/(auth)/home-redirect.tsx`
- `app/(platform)/(auth)/page.hosting.tsx`
- `app/(platform)/(auth)/_components/auth-card.tsx`
- `lib/auth-redirect.ts`
- `scripts/hosting-pages/public.json`
