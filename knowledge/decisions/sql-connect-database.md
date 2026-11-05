---
type: Decision
title: Store data in Firebase SQL Connect in asia-south1
description: Prisma over MySQL is replaced by Firebase SQL Connect (Cloud SQL for PostgreSQL) in GCP project splitify-416321, region asia-south1, starting with an empty database; its access rules read Firebase Auth.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T15:05:46Z
---

# Store data in Firebase SQL Connect in asia-south1

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
- Its region is `asia-south1` (Mumbai), where the app's people are (amounts are in rupees). Cloud Functions that
  SQL Connect triggers must run in the same region.
- SQL Connect starts with an empty database. Nothing is migrated: the old MySQL database was deleted by its host for
  inactivity.
- People sign in with [Firebase Auth](firebase-auth.md); SQL Connect's `@auth` rules read its `auth.uid`.
- The access rules in [group member permissions](group-member-permissions.md) are enforced by SQL Connect's
  `@auth` and `@check` rules on every query and mutation, not by app code.

## Consequences

- The browser reads and writes the database directly through the generated SDK; there is no server code in the
  path of a read or a write.
- SQL Connect's own query cache lives only in memory on the web, so offline reading needs a cache of the app's own
  ([offline scope](offline-first-scope.md)).
- Work that must not come from the browser (pushes, merging a contact into a new account) runs in Cloud Functions
  with the admin SDK.

## History

- 2026-11-05: wrote the paths of files that spec 2c removed (lib/db.ts, prisma/schema.prisma) as plain text, so verify no longer expects them; the decision itself is unchanged.
- 2026-11-04: Clerk was the sign-in, bridged to Firebase Auth by a custom-token function; now Firebase Auth is the sign-in, because the database starts empty and the bridge added a function, a webhook and a second vendor. See [Firebase Auth](firebase-auth.md).
- 2026-11-04: the old MySQL rows were to be migrated; now SQL Connect starts empty, because the old database was deleted for inactivity.
- 2026-11-04: the Clerk session was exchanged through Clerk's Firebase integration; now a Cloud Function of ours mints the custom token, because Clerk has deprecated that integration and new apps can't enable it.

## Sources

- prisma/schema.prisma
- lib/db.ts
- `package.json`
