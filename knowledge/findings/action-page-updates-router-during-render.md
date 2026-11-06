---
type: Finding
title: "Fixed: the action page updated the router during render"
description: The /auth/action/ page cleaned the address bar while React was rendering, and Next's history patch updated the Router, which React refuses; the cleanup now runs in a queued microtask, still before paint.
generated:
  by: agent:knowledge-job
  at: 2026-11-06T18:00:00Z
---

# Fixed: the action page updated the router during render

## Finding

The action page read its link inside `useSyncExternalStore`'s snapshot, during a render, and replaced the address bar
there. Next patches `history.replaceState` to update its Router, so React logged an error about updating a component
while another rendered.

## Evidence

The console errors the verify-banner-and-console-errors plan set out to remove
(`docs/plans/2026-11-06-verify-banner-and-console-errors.md`).

## Status

Fixed. `readActionLinkOnce` (`app/(platform)/(auth)/auth/action/action-handler.tsx`) reads the link once per document
and queues the cleanup in a microtask, which runs as soon as the render's synchronous work ends, before any other
task and so before the page paints; the one-time code is still gone before anything can read it. A `firebase`-kind
link forwards to Firebase once even if the cleanup throws ([sign in](../features/sign-in.md)).

## Sources

- `app/(platform)/(auth)/auth/action/action-handler.tsx`
- `docs/plans/2026-11-06-verify-banner-and-console-errors.md`
