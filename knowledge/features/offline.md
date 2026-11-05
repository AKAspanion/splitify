---
type: Feature
title: Offline use
description: What a person sees and can do with no connection: saved groups and expenses, queued expenses and settlements, online-only actions disabled, and a banner saying so.
status: draft
generated:
  by: ga-plugin/after-finish
  at: 2026-11-05T00:00:00Z
---

# Offline use

## What it does

Splitify installs as a PWA and opens with no connection. Groups, members, expenses and balances the person has seen
are shown from a cache saved on the device. Adding an expense or recording a settlement works: it appears marked
"Waiting to sync" and is sent when the connection returns. Everything else that changes data is disabled with
"You're offline. This needs a connection." The scope and its reasons are in [the decision](../decisions/offline-first-scope.md).

## Behaviour

- A banner reads "You're offline. Showing what was saved on this device.", with "<n> changes waiting to sync" offline
  or "Syncing <n> changes…" while they send (`components/offline/offline-banner.tsx`, `hooks/use-online.ts`).
- Signing in needs a connection: the sign-in screens say "You're offline. Connect to sign in."
- Sign-out deletes the saved cache.
- The shell comes from [the service worker](../operations/service-worker.md); the queue is described in
  [queue offline writes](../decisions/queue-offline-writes.md).

## Known gaps

See [offline gaps not yet checked](../findings/offline-gaps-unchecked.md).

## Sources

- `lib/offline/persist.ts`
- `lib/offline/queued-writes.ts`
- `hooks/use-online.ts`
- `components/offline/offline-banner.tsx`
- `components/offline/online-only.tsx`
- `components/offline/offline-sign-in-note.tsx`
