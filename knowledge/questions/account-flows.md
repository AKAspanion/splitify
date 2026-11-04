---
type: Open Question
title: Should people be able to sign out everywhere, or delete their account?
description: With Firebase Auth as the sign-in, neither "sign out of all devices" nor "delete my account" exists; each needs a decision before it can be built.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T15:45:00Z
---

# Should people be able to sign out everywhere, or delete their account?

## Question

Should Splitify let a person sign out of all their devices, and delete their account?

## Why it matters

[Firebase Auth](../decisions/firebase-auth.md) replaced Clerk, whose account screens offered these. Signing out
everywhere needs a Cloud Function that revokes the person's refresh tokens. Deleting an account needs a rule for
their payments and splits in groups other people still use: keep them under a placeholder name, or turn the account
back into a contact.

## Status

Open

## Sources

- `docs/specs/2026-11-04-sql-connect-foundation.md`
