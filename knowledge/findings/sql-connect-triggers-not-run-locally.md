---
type: Finding
title: Functions triggered by SQL Connect mutations don't run in the local emulator
description: mergeContactOnSignUp and the three push senders never load in the Functions emulator, so locally signing up merges no contact and sends no push.
status: draft
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-05T15:30:00Z
---

# Functions triggered by SQL Connect mutations don't run in the local emulator

## Finding

`mergeContactOnSignUp`, `sendActivityPushApp`, `sendActivityPushExpense` and `sendGroupDeletedPush` are triggered by SQL Connect
mutations. firebase-tools 15.34.2's `functionsEmulator.js` has no case for SQL Connect event triggers and logs them as
"Unsupported trigger", so under `pnpm dev` signing up doesn't merge a contact and no push is sent.

## Evidence

- Task 3's report and the run ledger's Task 3 ruling (2026-11-05).
- `functions/src/merge-contact.ts`, `functions/src/push-activity.ts`: the trigger definitions.
- `package.json`: firebase-tools is pinned at `15.34.2`.

## Status

Open. A newer firebase-tools may add the trigger; check when the pin is raised.

## Sources

- `functions/src/merge-contact.ts`
- `functions/src/push-activity.ts`
- `package.json`
