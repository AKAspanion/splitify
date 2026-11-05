---
type: Finding
title: A remount after a reset save that lost its reply can say "expired"
description: If the password save's reply is lost and the page then remounts, the check runs without the saved attempts and a spent code reads "expired" where "may already be changed" is right.
generated:
  by: agent:after-finish
  at: 2026-11-05T19:30:00Z
---

# A remount after a reset save that lost its reply can say "expired"

## Finding

After a reset save whose reply was lost, a remount of the form (the query provider's key flip at auth restore, see
[the remount finding](query-provider-remounts-pages-at-auth-restore.md)) checks the link with no attempts record.
Firebase says the code is spent, and the page reads "This link has expired or was already used." with "Ask for a new
link", though the password probably did change and "Your password may already be changed..." is right. It needs a lost
reply and a remount together.

## Evidence

- `.ga/runs/2026-11-05-password-reset-flow/reviews/final-r2-reviewer.md`, New Minor 1: "`reset-password-form.tsx:111-112`.
  A remount after a lost-reply save checks the link with no attempts record, so a code the lost save spent reads
  'expired', not 'may already be changed'." Its invariant: within one document, once a save lost its reply, any later
  answer that the code is spent reads "may already be changed".
- Ledger: "Final review: minor (deferred): a remount after a reset save that lost its reply checks the link without the
  saved attempts".

## Status

Open.

## Sources

- `app/(platform)/(auth)/auth/action/reset-password-form.tsx`
- `app/(platform)/(auth)/auth/action/code-call.ts`
