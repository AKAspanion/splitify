---
type: Decision
title: The full-page loading state shows the logo, not a spinner
description: While sign-in state loads, the app shows the Splitify logo centred, as AppLoading, instead of a spinner, so opening the app goes from the splash to the same logo.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-06T11:00:58Z
verified: human:ankitp@geekyants.com
stated: show the logo instead of spinner
stated_via: chat
---

# The full-page loading state shows the logo, not a spinner

## Context

Opening the Android app went from its splash (the logo) to a spinner on a blank page while the web app read the
sign-in state, then to the page: the logo vanished for a spinner, and came back on the page.

## Decision

The full-page wait while sign-in state loads shows the logo, centred: `AppLoading` (`components/app-loading.tsx`),
used by `RequireAuth` and by `/`'s `HomeRedirect`. In-content spinners (`UISpinner`, button and form spinners) stay.

## Consequences

- Opening the app reads as one splash: the Android splash's logo becomes the web app's logo. How it is drawn (its
  size, matched to the splash, and its pulse) is in [components](../design-system/components.md).
- It keeps `role="status"` and a visually hidden "Loading" for screen readers.

## Sources

- `components/app-loading.tsx`
- `components/auth/require-auth.tsx`
- `app/(platform)/(auth)/home-redirect.tsx`
- `public/images/logo.svg`
