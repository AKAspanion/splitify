---
type: Feature
title: Friends and contacts
description: Find a signed-up person by email and add them as a friend, or add someone who hasn't signed up as an offline contact.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Friends and contacts

## What it does

- **Add a friend:** search by exact email; each result has an add button. Adding makes the friendship both ways and,
  when started from a group, adds the friend to that group.
- **Add a contact:** when nobody has that email, the person can create a contact with a name and email. The contact
  can be added to groups and expenses like anyone else, and shows as "Verification pending" until they sign up.
- **Edit a contact:** fix a contact's name or email.

## Screens and routes

- Friends list: `app/(platform)/(app)/(screens)/friends/page.tsx`; one friend: `app/(platform)/(app)/(screens)/friends/[id]/page.tsx`, with
  `shared-groups.tsx` and `verify-details.tsx`.
- Search and add: `app/(platform)/(app)/(forms)/friends/add/page.tsx` (`search.tsx` runs the search, `action.tsx` adds the friend).
- New contact: `app/(platform)/(app)/(forms)/friends/add/contact/page.tsx`, creating the contact, then back to the search
  with the new email filled in.
- Edit contact: `app/(platform)/(app)/(forms)/friends/[id]/edit/contact/page.tsx`, saving the change.

## Data

These screens use `lib/data/people.ts` over [SQL Connect](../data/sql-connect.md): `useFriends`, `useFriend`,
`useSharedGroups`, `useSearchUser`, `useAddFriend`, `useCreateContact` and `useUpdateContact`. A contact's id is `spuser_`
plus a random id made in the browser (`contactId`), as the connector requires.

## Rules

- Search matches the email exactly (`SearchUserByEmail` in `dataconnect/app/people.gql`), and returns only someone the
  caller can add: a signed-up user, or a contact the caller is already friends with. Another person's offline contact
  isn't returned, and `AddFriend` refuses it too.
- How a contact becomes a real user when they sign up is in [contact identity](../domain/contact-identity.md).
- `UpdateContact` works only on a contact (not signed up) that is the caller's friend, which closes
  [missing authorization on writes](../findings/missing-authorization-on-writes.md). Any friend may change the name;
  the email changes only when the caller is the contact's sole friend, and never to one another user has
  ([decision](../decisions/contact-email-only-by-sole-friend.md)). The limits it leaves:
  [a pre-fix contact with two friends](../findings/two-friend-contact-cannot-be-re-emailed.md) and
  [a creator who deletes their account](../findings/second-friend-becomes-sole-friend-on-creator-deletion.md).

## Offline

Adding friends and contacts is online-only ([decision](../decisions/offline-first-scope.md)).

## History

- 2026-11-06: any friend could change a contact's name and email, and search returned another person's offline contact; now the email changes only by the contact's sole friend and search hides it, because the final review found a takeover path through legacy second friends. See [the decision](../decisions/contact-email-only-by-sole-friend.md).
- 2026-11-05: had nothing about offline; now adding is disabled offline, because the offline feature was built. See [offline](offline.md).
- 2026-11-05: described the server actions' rules (a self-friend refusal, an `updateContact` that changed any user); now the SQL Connect operations' rules, because spec 2c removed the actions.
- 2026-11-05: used server actions; now `lib/data/people.ts`, because spec 2b moved the screens onto SQL Connect.

## Sources

- `app/(platform)/(app)/(screens)/friends/page.tsx`
- `app/(platform)/(app)/(screens)/friends/[id]/page.tsx`
- `app/(platform)/(app)/(screens)/friends/[id]/verify-details.tsx`
- `app/(platform)/(app)/(screens)/friends/[id]/shared-groups.tsx`
- `app/(platform)/(app)/(forms)/friends/add/page.tsx`
- `app/(platform)/(app)/(forms)/friends/add/search.tsx`
- `app/(platform)/(app)/(forms)/friends/add/action.tsx`
- `app/(platform)/(app)/(forms)/friends/add/contact/page.tsx`
- `app/(platform)/(app)/(forms)/friends/add/contact/form.tsx`
- `app/(platform)/(app)/(forms)/friends/[id]/edit/contact/page.tsx`
- `dataconnect/app/people.gql`
- `lib/data/people.ts`
