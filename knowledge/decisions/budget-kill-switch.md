---
type: Decision
title: Turn billing off when spend reaches the monthly budget
description: A Cloud Function, copied from the flash-cards project, unlinks the project's billing account once actual spend reaches the budget; the app and the Cloud SQL instance stop, and the data is kept if billing is turned back on within 30 days.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T17:23:08Z
verified: human:ankitp@geekyants.com
---

# Turn billing off when spend reaches the monthly budget

## Context

The developer's flash-cards project has a budget kill switch, and they asked for its setup to be copied
([CI/CD](ci-cd-github-actions.md)). Splitify differs in one way that matters: it has a Cloud SQL instance behind
[SQL Connect](sql-connect-database.md). When a project's billing is turned off, every billable service shuts down;
Google's billing documentation says services restart once billing is back, and that a project shut down for more
than 30 days has its resources marked for deletion and they can't be recovered. The developer chose the kill switch
on the condition that data isn't lost when the database goes down: it isn't, as long as billing returns within those
30 days.

## Decision

- `billingKillSwitch` listens to the monthly budget's notifications on the Pub/Sub topic `budget-alerts` and, once
  actual spend (`costAmount`) reaches `budgetAmount`, sets the project's billing account to empty, which unlinks
  billing. Forecast alerts don't trigger it.
- It runs as a dedicated service account, `billing-kill-switch@`, holding only Project Billing Manager on this
  project, with at most one instance.
- The budget's amount is set in the Cloud Billing console, not in this repository.

## Consequences

- Once it fires, the app, the functions and the Cloud SQL instance stop until the developer raises the budget and
  turns billing back on. Re-linking while still over budget turns it off again at the next notification.
- Billing must be back within 30 days, or the project's resources, the database included, can be deleted.
- Cloud Billing reports spend hours late, so the bill can end slightly over the budget.
- During SQL Connect's free-trial instance the database costs nothing, so the switch rarely fires.

## Sources

- `functions/src/index.ts`
- `firebase.json`
