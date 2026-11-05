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
- Add Firebase Hosting Admin to `github-deploy@` for the hosting deploy, connect the custom domain `splitify.spanion.in` in the Firebase console (DNS records at the domain's provider, replacing any old record; the certificate can take hours), and add it to Authentication's Authorized domains ([decision](../decisions/public-pages-on-firebase-hosting-first.md)). The optional Variables for the hosting build are listed in the README, and the five `NEXT_PUBLIC_FIREBASE_*` Variables (API key, auth domain, project id, app id and the push VAPID key) are set in the repository: the build and CI read them, falling back to demo values in CI. `.env.sample` still lacks `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, which the developer adds.
- Set the function secret `SESSION_PASSWORD` in the Firebase project (a random value of at least 32 characters, never the old hard-coded one) before the first deploy of the `webauthn` function; without it the function answers 500. The README doesn't list this step yet ([Cloud Functions](../apps/functions.md)).
- Run the SQL Connect deploy by hand again (`deploy_dataconnect` ticked) after any schema change: the `PushToken` table is new and nothing deploys it otherwise.
- Run the first SQL Connect deploy by hand from a machine signed in with `firebase login`, because only the
  interactive CLI offers the free-trial Cloud SQL instance ([decision](../decisions/ci-cd-functions-deployed-by-hand.md)).
- Deploy the Cloud Functions by hand, `yarn deploy:functions`, signed in to the Firebase CLI as a project owner: the
  CLI grants Google Cloud's service agents the roles a functions deploy needs, which `github-deploy@` can't
  ([decision](../decisions/ci-cd-functions-deployed-by-hand.md)).
- Set up the budget kill switch: its `billing-kill-switch@` account, the Cloud Run Invoker grant for the trigger, and
  the budget's Pub/Sub connection ([decision](../decisions/budget-kill-switch.md), [functions](../apps/functions.md)).

## What is not confirmed

The README lists eleven roles for `github-deploy@`. Google's docs confirm only Cloud Functions Admin, Service
Account User and Firebase Data Connect Admin; the rest are the spec's list. The deploy job installs the root
dependencies with `--ignore-scripts` (for the build) and the
`functions/` ones. The first real deploy, on 2026-11-05, deployed hosting and failed on the functions, which needed
IAM changes `github-deploy@` can't make; the functions now deploy by hand. The roles `github-deploy@` holds for
functions may now be spare, and the first deploy may still fail on a missing permission (the log names it).

## History

- 2026-11-05: added the `SESSION_PASSWORD` secret step and dropped the Prisma remark, because the webauthn function needs the secret and Prisma is removed.
- 2026-11-05: added the five Firebase web Variables and the manual SQL Connect deploy the `PushToken` table needs, because sign-in and push read them.
- 2026-11-05: the functions deployed from the deploy workflow; now a project owner deploys them by hand, because the CI deploy couldn't grant the service agents' IAM roles. See [the decision](../decisions/ci-cd-functions-deployed-by-hand.md).
- 2026-11-05: the setup covered functions and SQL Connect only; now it also covers the hosting deploy role, the custom domain and the Authorized domain, because the public pages go to Firebase Hosting.

## Sources

- `README.md`
- `.github/workflows/deploy.yml`
- `firebase.json`
