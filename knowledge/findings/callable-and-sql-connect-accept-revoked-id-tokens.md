---
type: Finding
title: The deleteMyAccount callable and SQL Connect still accept a revoked ID token
description: Only the HTTP guard checks revocation, so another device of a deleted account can reload within the hour and register a push token for the anonymised user.
generated:
  by: agent:knowledge-job
  at: 2026-11-06T20:00:00Z
---

# The deleteMyAccount callable and SQL Connect still accept a revoked ID token

## Finding

The HTTP guard asks Auth about revocation ([the fixed finding](guard-accepts-revoked-id-tokens.md)), but nothing else
does. The `deleteMyAccount` callable (`functions/src/account/delete-my-account.ts`) takes `request.auth` as Firebase
gives it, and SQL Connect's `@auth` rules (for example `RegisterMyPushToken` in `dataconnect/app/push-tokens.gql`) only
need a signed token. So after an account is deleted, an unexpired ID token from another device, or a stolen copy, still
passes for up to an hour.

The reachable harm: that other device reloads the app within the hour with notification permission granted,
`app/launch.tsx` calls `registerWebPush`, and a `PushToken` is upserted for the anonymised user. `DeleteUserData`
already ran, so nothing removes it, and the shared groups' memberships stay, so the device keeps receiving their
activity pushes after the token expires. The callable matters less: deletion is idempotent and needs a sign-in from the
last 5 minutes.

## Evidence

Final security review of the open-findings-fixes plan, Minor M3
(`.ga/runs/2026-11-06-open-findings-fixes/reviews/final-security-reviewer.md`).

## Status

Open.

## Sources

- `functions/src/account/delete-my-account.ts`
- `dataconnect/app/push-tokens.gql`
- `app/launch.tsx`
- `functions/src/http/guard.ts`
