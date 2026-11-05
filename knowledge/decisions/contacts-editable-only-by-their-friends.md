---
type: Decision
title: Only a contact's existing friends may befriend or edit it, and no contact may take an email in use
description: AddFriend refuses an offline contact (signedUp false) the caller isn't already friends with, and UpdateContact refuses an email another user has, so nobody can point someone else's contact at their own email and inherit its groups.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-05T12:45:35Z
verified: human:ankitp@geekyants.com
stated: "Security audit, High: any group-mate can befriend a contact someone else created, change its email to their own, and the merge moves the contact's groups to them. How should the fix close it? (Block both: AddFriend refuses a contact unless you're already its friend, UpdateContact refuses an email in use) — Block both (Recommended)"
stated_via: qa
---

# Only a contact's existing friends may befriend or edit it, and no contact may take an email in use

## Context

The 2026-11-05 full-repo security audit found a takeover path through three pieces that were each sound alone:

1. `AddFriend` (`dataconnect/app/people.gql`) checked only that the friend exists, so any member who saw an offline
   contact's `spuser_` id in a shared group could become its friend.
2. `UpdateContact` lets any friend of a contact change its email, with no check that the email is free (unlike
   `CreateContact`).
3. `mergeContactOnSignUp` (`functions/src/merge-contact.ts`) runs after every `UpsertMe` and moves the contact that has
   the caller's verified email into the caller's account.

So a group-mate could befriend someone else's contact, set its email to their own verified address, sign in again,
and receive every membership, payment, split and friendship the contact had, including groups they were never in.

The developer was offered two fixes: block both steps with rules only, or record each contact's creator and let only
the creator edit it (a schema change and a backfill).

## Decision

Block both steps in the SQL Connect rules, with no schema change:

- `AddFriend` refuses a target with `signedUp == false` unless the caller already has a `Friendship` with it.
- `UpdateContact` refuses an email that another `User` row already has, as `CreateContact` does.

## Consequences

- Someone can no longer add another person's offline contact to their own friends list. They can still add a
  signed-up person, and create their own contact.
- Friendships made before the fix stay, so a contact already befriended by someone other than its creator can still
  be edited by them. The email check means it can only be given a free address, which nobody can sign in with until
  they verify it.
- The merge on every `UpsertMe` stays as it is, so a person who verifies their email later is still merged.

## Sources

- `dataconnect/app/people.gql`
- `dataconnect/app/people.test.ts`
- `functions/src/merge-contact.ts`
