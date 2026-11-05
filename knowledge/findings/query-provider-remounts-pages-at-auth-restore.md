---
type: Finding
title: QueryProvider remounts every page at auth restore, so one-shot mount effects run twice
description: The query provider is keyed by uid, so when someone is signed in the whole page subtree remounts once auth restores; any one-shot effect on mount runs twice.
generated:
  by: agent:after-finish
  at: 2026-11-05T19:30:00Z
---

# QueryProvider remounts every page at auth restore, so one-shot mount effects run twice

## Finding

`QueryProvider` keys `PersistQueryClientProvider` by `uid ?? "signed-out"`. When someone is signed in, `uid` changes
from `null` to the real id at auth restore, so every page below remounts once. A page that does a one-shot side effect
on mount does it twice. On `/auth/action/` this spent a verify code twice and showed "expired" for a good link; the fix
wave kept the link, the verify call and the password save at module scope instead
([sign in](../features/sign-in.md)). Other pages with a one-shot mount effect carry the same risk. Rule for new pages:
never rely on a mount effect running once.

## Evidence

- `.ga/runs/2026-11-05-password-reset-flow/reviews/final-r1-reviewer.md`, Out-of-Scope Observations:
  "`components/providers.tsx:59`: keying `PersistQueryClientProvider` by `uid ?? "signed-out"` remounts every page's
  subtree at auth restore, whenever someone is signed in. Any page that does a one-shot side effect on mount does it
  twice, as `VerifyEmailResult` does in finding 1. Worth a note in the knowledge base, or a different restore strategy."
- Ledger: "Final review: minor (deferred): QueryProvider keys by uid ?? signed-out, so every page remounts at auth
  restore when signed in and one-shot mount effects run twice".
- `components/providers.tsx:59` at d7ad71f.

## Status

Open. The action page is guarded; the cause is not changed.

## Sources

- `components/providers.tsx`
- `app/(platform)/(auth)/auth/action/code-call.ts`
