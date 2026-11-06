---
type: Finding
title: "Fixed: the verify-banner dismissal's storage catch blocks logged nothing"
description: readVerifyBannerDismissal and writeVerifyBannerDismissal swallowed a localStorage error without logging it, so a browser that blocked storage showed the banner on every visit with nothing in the console to say why; both now warn with the error's class.
generated:
  by: agent:knowledge-job
  at: 2026-11-06T18:00:00Z
---

# Fixed: the verify-banner dismissal's storage catch blocks logged nothing

## Finding

In `lib/auth/verify-banner-dismissal.ts` both `catch` blocks (read and write) discarded the error. When storage is
blocked or full, Dismiss hides the banner for that visit only and it returns on the next one, and nothing was logged
that would explain it. The behaviour is by design ([decision](../decisions/verify-banner-placement.md)); only the
missing log was the gap.

## Evidence

Security review of the verify-banner-and-console-errors plan (`.ga/runs/2026-11-06-verify-banner-and-console-errors/`).

## Status

Fixed: a failed read or write calls `console.warn("[verify-banner] read failed" | "[verify-banner] write failed", <class>)`
with the error's name (`SecurityError`, `QuotaExceededError`, else the type of what was thrown), never its message.

## Sources

- `lib/auth/verify-banner-dismissal.ts`
