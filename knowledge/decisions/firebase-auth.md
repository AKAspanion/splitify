---
type: Decision
title: Sign people in with Firebase Auth, by Google or email and password
description: Firebase Auth replaces Clerk; people sign in with Google or with email and password, a user's row is written from their verified token, and a contact becomes a signed-up user only once that email is verified.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T15:30:02Z
verified: human:ankitp@geekyants.com
---

# Sign people in with Firebase Auth, by Google or email and password

## Context

SQL Connect's access rules read a Firebase Auth token ([database](sql-connect-database.md)). Keeping Clerk meant a
Cloud Function to exchange each Clerk session for a Firebase custom token (Clerk's own Firebase integration is
deprecated), plus the Clerk webhook to write user rows. Clerk also renews its short session tokens over the network,
which works against [offline use](offline-first-scope.md), while Firebase Auth restores a signed-in user from
IndexedDB with no network. The database starts empty, so there were no Clerk users to keep. The developer chose to
switch, with Google and email-and-password sign-in.

## Decision

- Firebase Auth is the only sign-in. Clerk, its webhook and proxy.ts are removed.
- Sign-in methods: Google, and email and password. Password reset is Firebase's reset email.
- A person's `User` row is written by a `upsertMe` mutation the browser runs after sign-in. Its id, email and name
  come from the signed token (`auth.uid`, `auth.token.email`, `auth.token.name`), never from the request. Emails are
  stored trimmed and lower-cased.
- When someone signs up with the email of an existing contact, the contact's groups, payments, splits, friendships
  and expenses move onto the new account, done by a Cloud Function triggered by `upsertMe`. It happens only when
  `auth.token.email_verified` is true: Google accounts are verified, and an email-and-password account after it
  confirms Firebase's verification email. Without that, anyone could sign up with someone else's contact email and
  take over that contact's history.
- An email-and-password account that hasn't verified its email can use the app. A banner asks it to verify, with a
  button to send the email again, until it does; its contact merge waits for the verification.

## Consequences

- The sign-in and sign-up screens are the app's own, built from its components instead of Clerk's.
- Google blocks its sign-in inside the iOS WebView wrapper ([iOS app](../apps/ios.md)); email and password work
  there.
- The signed-in user is known offline, so queued writes go out signed in after a reload.

## History

- 2026-11-05: password reset is still Firebase's reset email; its link now ends on the app's own page, `/auth/action/`, rather than Firebase's. See [sign in](../features/sign-in.md).
- 2026-11-05: wrote the paths of files that spec 2c removed (app/api/webhook/clerk/route.ts, proxy.ts) as plain text, so verify no longer expects them; the decision itself is unchanged.
- 2026-11-05: what an unverified email-and-password account could do was unset; now it can use the app with a banner asking it to verify, because the developer chose that over blocking it.

## Sources

- proxy.ts
- app/api/webhook/clerk/route.ts
- `components/providers.tsx`
