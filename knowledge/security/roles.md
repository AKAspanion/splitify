---
type: Security
title: Roles
description: There are no roles: any member of a group may act on it. SQL Connect's rules and the functions' membership checks enforce it.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Roles

## Roles

- **Signed out:** the landing page, `/privacy`, `/delete-account` and the sign-in screens.
- **Signed in:** everything else, limited by the rules below. The schema has no role field, and group membership
  (`GroupMember`) carries no role, so the group's creator is not recorded as its owner ([SQL Connect
  schema](../data/sql-connect.md)).

## Who may do what

[Group member permissions](../decisions/group-member-permissions.md) decides it: any member of a group, for that group and
its expenses. The rules are written into the operations, so the browser cannot skip them:

- SQL Connect operations in `dataconnect/app/people.gql`, `dataconnect/app/groups.gql` and the expense operations check
  membership or ownership in the same transaction as the write ([where each rule lives](../data/sql-connect.md)). The
  rule tests under `dataconnect/` run on the emulators with `yarn test:rules`.
- The `reports` function answers members of the group only, and a group that does not exist and one the caller is not in
  answer the same ([reports](../features/reports.md)).
- The `webauthn` function reads and writes only the caller's own devices, and `deleteMyAccount` acts only on the caller.
- Searching by email returns another user only on an exact match (`dataconnect/app/people.gql`).
- There is no admin page: the logs page was removed ([decision](../decisions/remove-admin-logs-page.md)).

The findings that once listed what any signed-in person could do, all fixed by these rules:
[missing membership checks on reads](../findings/missing-group-membership-checks-on-reads.md),
[missing authorization on writes](../findings/missing-authorization-on-writes.md),
[the open push relay](../findings/push-notification-open-relay.md) and
[admin logs unprotected](../findings/admin-logs-unprotected.md).

## History

- 2026-11-05: listed what the server's actions and routes let any signed-in person do; now says SQL Connect's rules and the functions enforce member-only access, because spec 2c removed those actions and routes.
- 2026-11-04: added where SQL Connect enforces the rules; dropped the push relay and admin page from what the code allows, because both routes were removed ([decision](../decisions/remove-admin-logs-page.md)).

## Sources

- `dataconnect/app/people.gql`
- `dataconnect/app/groups.gql`
- `functions/src/reports/index.ts`
- `functions/src/webauthn/index.ts`
- `functions/src/account/delete-my-account.ts`
