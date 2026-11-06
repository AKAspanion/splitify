---
type: Finding
title: A contact made before the fix with two friends can be renamed but not re-emailed by either
description: UpdateContact lets only a contact's sole friend change its email, so a contact that already has two friends from before the fix is stuck on its current email.
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-06T09:00:00Z
---

# A contact made before the fix with two friends can be renamed but not re-emailed by either

## Finding

`UpdateContact` changes a contact's email only while the caller is the contact's sole friend
([decision](../decisions/contact-email-only-by-sole-friend.md)). A contact that gained a second friend before
`AddFriend` stopped allowing it has two friendships, so neither friend can fix a mistyped email; either can still
rename it. Nothing in the app reaches such a contact's second friendship to remove it.

## Evidence

The data and functions fix wave of the repository-modernization run, deferred as Minor in its ledger; the rule is in
`dataconnect/app/people.gql`.

## Status

Open.

## Sources

- `dataconnect/app/people.gql`
