---
type: Finding
title: "Fixed: the query provider remounted every page at auth restore, so one-shot mount effects ran twice"
description: The query provider was keyed by uid, so the whole page subtree remounted once auth restored and any one-shot mount effect ran twice; the provider no longer has a key.
generated:
  by: agent:after-finish
  at: 2026-11-05T19:30:00Z
---

# Fixed: the query provider remounted every page at auth restore, so one-shot mount effects ran twice

## Finding

`QueryProvider` keyed `PersistQueryClientProvider` by `uid ?? "signed-out"`. When someone was signed in, `uid` changed
from `null` to the real id at auth restore, so every page below remounted once, and a page with a one-shot side effect
on mount did it twice. On `/auth/action/` this spent a verify code twice and showed "expired" for a good link; the
page keeps the link, the verify call and the password save at module scope ([sign in](../features/sign-in.md)). Those
guards stay and are harmless now. It also made [sign-up stay on an empty form](sign-up-stays-on-empty-form.md).

## Evidence

- `.ga/runs/2026-11-05-password-reset-flow/reviews/final-r1-reviewer.md`, Out-of-Scope Observations:
  "`components/providers.tsx:59`: keying `PersistQueryClientProvider` by `uid ?? "signed-out"` remounts every page's
  subtree at auth restore, whenever someone is signed in."
- Ledger: "Final review: minor (deferred): QueryProvider keys by uid ?? signed-out, so every page remounts at auth
  restore when signed in and one-shot mount effects run twice".
- Fixed by 259fe40 and the commits after it, confirmed in the browser.

## Status

Fixed. The provider follows the signed-in person's saved cache without a key
([decision](../decisions/offline-first-scope.md)). Still a good rule for new pages: don't rely on a mount effect
running once.

## Sources

- `components/providers.tsx`
- `lib/offline/restore-cache.ts`
- `app/(platform)/(auth)/auth/action/code-call.ts`
