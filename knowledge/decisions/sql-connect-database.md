---
type: Decision
title: Store data in Firebase SQL Connect, signed in through Clerk
description: Prisma over MySQL is replaced by Firebase SQL Connect (Cloud SQL for PostgreSQL) in GCP project splitify-416321, starting with an empty database; Clerk stays the sign-in and is bridged to Firebase Auth.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T15:05:46Z
---

# Store data in Firebase SQL Connect, signed in through Clerk

## Context

The app was being revived after a pause. In early testing its server-rendered pages were very slow, and the
developer wants it to run from the browser as an offline-first PWA ([offline scope](offline-first-scope.md)) on
Firebase ([hosting](static-build-on-firebase-hosting.md)). Prisma over MySQL needs a server between the browser and
the database. SQL Connect (Firebase's new name for Data Connect, since April 2026) puts a managed PostgreSQL behind
generated client SDKs whose queries and mutations carry their own access rules, so the browser can call it directly.
The developer already has a GCP project for it, `splitify-416321`.

## Decision

- The database is Firebase SQL Connect, backed by Cloud SQL for PostgreSQL, in project `splitify-416321`. Prisma,
  MySQL and the MariaDB driver adapter are removed.
- Clerk stays the only way people sign in. SQL Connect's `@auth` rules read a Firebase Auth token, so the browser
  sends its Clerk session token to a Cloud Function, which verifies it with `@clerk/backend` and returns a Firebase
  custom token for the Clerk user id (`admin.auth().createCustomToken`); the browser signs in to Firebase with it.
  Clerk's own Firebase integration is deprecated and can't be enabled for new apps, so the exchange is ours. The
  Firebase `auth.uid` is the Clerk user id. People never see Firebase Auth.
- The access rules in [group member permissions](group-member-permissions.md) are enforced by SQL Connect's
  `@auth` and `@check` rules on every query and mutation, not by app code.
- SQL Connect starts with an empty database. Nothing is migrated: the old MySQL database was deleted by its host for
  inactivity.

## Consequences

- The browser reads and writes the database directly through the generated SDK; there is no server code in the
  path of a read or a write.
- SQL Connect's own query cache lives only in memory on the web, so offline reading needs a cache of the app's own
  ([offline scope](offline-first-scope.md)).
- Work that must not come from the browser (pushes, the Clerk webhook) runs in Cloud Functions with the admin SDK.

## History

- 2026-11-04: the old MySQL rows were to be migrated; now SQL Connect starts empty, because the old database was deleted for inactivity.
- 2026-11-04: the Clerk session was exchanged through Clerk's Firebase integration; now a Cloud Function of ours mints the custom token, because Clerk has deprecated that integration and new apps can't enable it.

## Sources

- `prisma/schema.prisma`
- `lib/db.ts`
- `package.json`
