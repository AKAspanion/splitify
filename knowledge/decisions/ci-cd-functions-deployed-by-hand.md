---
type: Decision
title: Check pull requests and deploy hosting from GitHub Actions; deploy Cloud Functions by hand
description: GitHub Actions checks every pull request and deploys the public pages on push to main; the Cloud Functions deploy by hand from a project owner's machine, because the CI service account can't grant the IAM roles a functions deploy needs.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T19:27:51Z
verified: human:ankitp@geekyants.com
---

# Check pull requests and deploy hosting from GitHub Actions; deploy Cloud Functions by hand

## Context

The [earlier decision](ci-cd-github-actions.md) had GitHub Actions deploy the Cloud Functions on every push to
`main`, signed in as the `github-deploy@` service account. The first such deploy failed: a functions deploy makes
the Firebase CLI grant roles to Google Cloud's service agents (Pub/Sub, Eventarc, the compute account), and
`github-deploy@` isn't allowed to change the project's IAM policy ("We failed to modify the IAM policy for the
project"). The developer chose to deploy the functions from their own machine instead of giving the CI account
the right to change IAM. The hosting deploy in the same workflow works and stays.

## Decision

- Pull requests run CI in GitHub Actions; a push to `main` runs CI again and then deploys the public pages to
  Firebase Hosting ([public pages first](public-pages-on-firebase-hosting-first.md)).
- **Cloud Functions** deploy by hand, `pnpm deploy:functions`, from a machine signed in to the Firebase CLI as a
  project owner. The deploy workflow doesn't deploy them.
- **The SQL Connect schema and connectors** deploy only when the deploy workflow is started by hand with its
  checkbox ticked, since a schema change can drop columns. The first deploy, which creates the Cloud SQL instance,
  is run once by the developer from their machine, because only the interactive CLI offers the free-trial instance.
- CI signs in to Google Cloud with a service-account JSON key in the `FIREBASE_SERVICE_ACCOUNT` repository secret,
  rather than Workload Identity Federation. The deploy job writes that key to a file only for the SQL Connect
  deploy.

## Consequences

- A change to `functions/` reaches production only when someone deploys it by hand; merging it to `main` doesn't.
- `github-deploy@` never needs the right to change the project's IAM policy.
- A stored key can leak; its service account holds only the roles the deploy needs, and the key is rotated by
  replacing the secret.
- A schema change reaches production only when someone starts the deploy by hand.

## Sources

- `.github/workflows/deploy.yml`
- `package.json`
- `firebase.json`
- `functions/package.json`
- `README.md`
