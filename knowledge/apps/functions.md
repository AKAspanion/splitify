---
type: Application
title: Cloud Functions
description: The Firebase Cloud Functions in functions/: the contact merge after sign-up and the budget kill switch.
status: draft
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-04T18:30:00Z
---

# Cloud Functions

Node 24 functions in `functions/`, built with their own `typescript` and `tsconfig.json` (test files excluded),
deployed by hand with `yarn deploy:functions` from a project owner's machine, not by the deploy workflow
([decision](../decisions/ci-cd-functions-deployed-by-hand.md)). `functions/src/index.ts` exports both.

## Functions

- `mergeContactOnSignUp` (`functions/src/merge-contact.ts`): a SQL Connect trigger on the `app` connector's
  `UpsertMe` mutation, in `asia-south1`. It merges a contact into the verified new account through the `admin`
  connector ([SQL Connect schema](../data/sql-connect.md), [contact identity](../domain/contact-identity.md)).
- `billingKillSwitch` (`functions/src/kill-switch.ts`, wired in `index.ts`): a Pub/Sub trigger on topic
  `budget-alerts` in `asia-south1`, running as `billing-kill-switch@` with `maxInstances: 1`. It unlinks billing once
  actual spend reaches the budget ([decision](../decisions/budget-kill-switch.md)). Its tests cover
  `parseNotification`, `enforceBudget` and the trigger options; the handler body itself has no direct test.

## History

- 2026-11-05: the deploy workflow deployed the functions; now a project owner deploys them by hand. See [the decision](../decisions/ci-cd-functions-deployed-by-hand.md).

## Sources

- `functions/src/index.ts`
- `functions/src/merge-contact.ts`
- `functions/src/kill-switch.ts`
- `functions/package.json`
- `firebase.json`
