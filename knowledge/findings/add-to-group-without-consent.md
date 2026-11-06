---
type: Finding
title: Any member can add a signed-up person to their group without asking
description: AddFriend with a group adds anyone found by email to the caller's group, skipping AddGroupMember's friends-only rule; the person gets a push with the group's title, and the group sees their email.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-05T12:45:35Z
---

# Any member can add a signed-up person to their group without asking

## Finding

`AddGroupMember` (`dataconnect/app/groups.gql`) adds only the caller's friends. `AddFriend` with `withGroup`
(`dataconnect/app/people.gql`) makes the friendship and the membership in one step, so it adds any signed-up person
to the caller's group. Its only lookup is `SearchUserByEmail`, which has no rate limit. The added person:

- gets the "added to group" push, whose text is the group's title. A hostile title such as "Account locked – visit
  <a link>" reaches their devices;
- has their email shown to the group through `ListGroupMembers`.

## Evidence

The 2026-11-05 full-repo security audit, Medium 2: AddFriend with `withGroup` skips AddGroupMember's "only your
friends" rule (`groups.gql:104-110`).

## Status

Open. The developer chose to keep the add-by-email flow for now and to build invite-and-accept as its own feature.
They gave this answer to the audit questions on 2026-11-05.

## Sources

- `dataconnect/app/people.gql`
- `dataconnect/app/groups.gql`
- `functions/src/push-activity.ts`
