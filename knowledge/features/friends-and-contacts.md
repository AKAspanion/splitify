---
type: Feature
title: Friends and contacts
description: Find a signed-up person by email and add them as a friend, or add someone who hasn't signed up as an offline contact.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
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
- Search and add: `app/(platform)/(app)/(forms)/friends/add/page.tsx` (`search.tsx` calls `searchUser`, `action.tsx` calls
  `createFriend`).
- New contact: `app/(platform)/(app)/(forms)/friends/add/contact/page.tsx`, calling `createContact`, then back to the search
  with the new email filled in.
- Edit contact: `app/(platform)/(app)/(forms)/friends/[id]/edit/contact/page.tsx`, calling `updateContact`.

## Rules

- A person can't befriend themselves (`createFriend` refuses).
- Search excludes the caller and matches the email exactly (`actions/search-user/index.ts`).
- How a contact becomes a real user when they sign up is in [contact identity](../domain/contact-identity.md).
- `updateContact` changes any user's name and email, not only the caller's contacts:
  [missing authorization on writes](../findings/missing-authorization-on-writes.md).

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
- `actions/search-user/index.ts`
- `actions/create-friend/index.ts`
- `actions/create-contact/index.ts`
- `actions/update-contact/index.ts`
