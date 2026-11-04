---
type: Open Question
title: Should people be able to sign out of all their devices?
description: With Firebase Auth as the sign-in, "sign out of all devices" doesn't exist; it needs a decision before it can be built. Deleting an account is answered by anonymise-deleted-accounts.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T15:45:00Z
---

# Should people be able to sign out of all their devices?

## Question

Should Splitify let a person sign out of all their devices?

## Why it matters

[Firebase Auth](../decisions/firebase-auth.md) replaced Clerk, whose account screens offered this. Signing out
everywhere needs a Cloud Function that revokes the person's refresh tokens.

## Status

Open

## History

- 2026-11-04: asked both about signing out everywhere and about deleting an account; now only signing out everywhere, because [anonymise deleted accounts](../decisions/anonymise-deleted-accounts.md) answers deletion.

## Sources

- `docs/specs/2026-11-04-sql-connect-foundation.md`
