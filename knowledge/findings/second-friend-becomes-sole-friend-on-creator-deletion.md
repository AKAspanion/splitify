---
type: Finding
title: A second friend from before the fix becomes a contact's sole friend when its creator deletes their account, and can then change its email
description: UpdateContact lets a contact's sole friend change its email, and deleting the creator's account removes their friendship, so a remaining pre-fix second friend can then point the contact at an address it owns.
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-06T09:00:00Z
---

# A second friend from before the fix becomes a contact's sole friend when its creator deletes their account, and can then change its email

## Finding

The contact takeover path ([decision](../decisions/contact-email-only-by-sole-friend.md)) is closed by letting only a
contact's sole friend change its email. A contact made before the fix may have a second friend. When its creator
deletes their account ([profile](../features/profile.md)), that friendship goes, and the second friend becomes the sole
friend, so it can change the contact's email to an address it owns, verify it, and inherit the contact's groups when
`mergeContactOnSignUp` runs. It needs a pre-fix second friend and the creator leaving, so it is rare.

## Evidence

The repository-modernization run's final re-review, New Minor 1, recorded in the run's ledger (kept beside
`docs/plans/2026-11-05-repo-modernization.md` as its record) as a provisional ruling. Closing it needs a creator column on `User`, or blocking email changes on
contacts whose creator left; both are schema-sized. The developer confirms this residual risk or asks for the column.

## Status

Open.

## Sources

- `dataconnect/app/people.gql`
- `functions/src/account/delete-my-account.ts`
- `functions/src/merge-contact.ts`
