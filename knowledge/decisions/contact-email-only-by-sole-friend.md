---
type: Decision
title: Only a contact's sole friend may change its email, and search offers only people the caller can add
description: AddFriend refuses someone else's offline contact, SearchUserByEmail doesn't return one, UpdateContact lets any friend rename a contact but only its sole friend change its email, and no contact may take an email in use.
status: draft
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-06T09:00:00Z
---

# Only a contact's sole friend may change its email, and search offers only people the caller can add

This replaces [Only a contact's existing friends may befriend or edit it](contacts-editable-only-by-their-friends.md).
The developer approved the first rules; the two below were added by the repository-modernization run as provisional
rulings in its ledger, and the developer still has to confirm them.

## Context

The earlier decision blocked `AddFriend` on someone else's offline contact and an email already in use, and accepted
that friendships made before the fix stay, so a contact with a second friend could still be edited by it. Its
consequence said a person could "create their own contact" instead and that those legacy friends were acceptable. The
run's final review showed neither holds:

- A second friend from before the fix can point the contact at a fresh address it owns, verify that address, and
  inherit the contact's groups when `mergeContactOnSignUp` runs ([decision](contacts-editable-only-by-their-friends.md)).
- Search still returned the other person's offline contact, so the screen offered an Add button that answered "Not
  found", and `CreateContact` answered "email in use": a dead end.

## Decision

In `dataconnect/app/people.gql`:

- `AddFriend` refuses a target with `signedUp == false` unless the caller already has a `Friendship` with it.
- `SearchUserByEmail` returns a signed-up user, or a contact the caller is already friends with, and nothing else.
- `UpdateContact` changes a contact's name for any friend of it, and its email only when the caller is its sole friend
  (no other `Friendship` row points at it) or the email is unchanged up to case.
- `UpdateContact` refuses an email another `User` already has, as `CreateContact` does.

The contact's creator is its first and usually only friend, so no creator column is needed.

## Consequences

- Someone else's offline contact never appears in search, and a person someone else added as a contact can't be added
  by others until they sign up.
- A contact made before the fix with two friends can be renamed but not re-emailed by either friend:
  [finding](../findings/two-friend-contact-cannot-be-re-emailed.md).
- When a contact's creator deletes their account, a remaining friend becomes its sole friend and can change its email:
  [finding](../findings/second-friend-becomes-sole-friend-on-creator-deletion.md). Closing it needs a creator column
  or blocking email changes on contacts whose creator left, both schema-sized; the developer confirms the residual risk
  or asks for the column.
- The merge on every `UpsertMe` stays as it is, so a person who verifies their email later is still merged.

## Sources

- `dataconnect/app/people.gql`
- `dataconnect/app/people.test.ts`
- `functions/src/merge-contact.ts`
