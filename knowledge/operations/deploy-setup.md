---
type: Runbook
title: Deploy setup, done once
description: The one-time Google Cloud and GitHub steps before the deploy workflow and the budget kill switch work, and what is still unconfirmed about the deploy account's roles.
status: draft
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-04T18:30:00Z
---

# Deploy setup, done once

The steps live in `README.md` (sections "Deploy" and "Budget kill switch"); this concept says why they exist and
what is uncertain, and does not copy them. [The workflows](ci-cd.md) read what these steps create.

## What the setup covers

- Enable the Google Cloud APIs, create the `github-deploy@` service account with its roles, put its key in the
  `FIREBASE_SERVICE_ACCOUNT` secret and set `FIREBASE_PROJECT_ID`.
- Add Firebase Hosting Admin to `github-deploy@` for the hosting deploy, connect the custom domain `splitify.spanion.in` in the Firebase console (DNS records at the domain's provider, replacing any old record; the certificate can take hours), and add it to Authentication's Authorized domains ([decision](../decisions/public-pages-on-firebase-hosting-first.md)). The optional Variables for the hosting build are listed in the README.
- Run the first SQL Connect deploy by hand from a machine signed in with `firebase login`, because only the
  interactive CLI offers the free-trial Cloud SQL instance ([decision](../decisions/ci-cd-github-actions.md)).
- Set up the budget kill switch: its `billing-kill-switch@` account, the Cloud Run Invoker grant for the trigger, and
  the budget's Pub/Sub connection ([decision](../decisions/budget-kill-switch.md), [functions](../apps/functions.md)).

## What is not confirmed

The README lists eleven roles for `github-deploy@`. Google's docs confirm only Cloud Functions Admin, Service
Account User and Firebase Data Connect Admin; the rest are the spec's list. The deploy job installs the root
dependencies with `--ignore-scripts` (for the hosting build; a plain install would run `prisma db push`) and the
`functions/` ones. The first real deploy may fail on a
missing permission (the log names it) or show that some roles are spare.

## History

- 2026-11-05: the setup covered functions and SQL Connect only; now it also covers the hosting deploy role, the custom domain and the Authorized domain, because the public pages go to Firebase Hosting.

## Sources

- `README.md`
- `.github/workflows/deploy.yml`
- `firebase.json`
