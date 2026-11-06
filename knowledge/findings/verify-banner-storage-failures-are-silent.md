---
type: Finding
title: The verify-banner dismissal's storage catch blocks log nothing
description: readVerifyBannerDismissal and writeVerifyBannerDismissal swallow a localStorage error without logging it, so a browser that blocks storage shows the banner on every visit with nothing in the console to say why.
generated:
  by: agent:knowledge-job
  at: 2026-11-06T18:00:00Z
---

# The verify-banner dismissal's storage catch blocks log nothing

## Finding

In `lib/auth/verify-banner-dismissal.ts` both `catch` blocks (read and write) discard the error. When storage is
blocked or full, Dismiss hides the banner for that visit only and it returns on the next one, and nothing is logged
that would explain it. The behaviour is by design ([decision](../decisions/verify-banner-placement.md)); only the
missing log is the gap.

## Evidence

Security review of the verify-banner-and-console-errors plan (`.ga/runs/2026-11-06-verify-banner-and-console-errors/`).

## Status

Open.

## Sources

- `lib/auth/verify-banner-dismissal.ts`
