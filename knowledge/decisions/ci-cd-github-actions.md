---
type: Decision
title: Check pull requests and deploy from GitHub Actions with a service account
description: GitHub Actions checks every pull request and deploys on push to main, modelled on the flash-cards project; Cloud Functions deploy automatically, the SQL Connect schema only when started by hand, signed in with a service-account key.
status: superseded
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T17:23:08Z
superseded_by: decisions/ci-cd-functions-deployed-by-hand
---

# Check pull requests and deploy from GitHub Actions with a service account

## Context

Splitify had no CI, and its web app deployed through Vercel's own integration. Moving to Firebase
([hosting](static-build-on-firebase-hosting.md), [SQL Connect](sql-connect-database.md)) needs a way to deploy the
SQL Connect schema, the Cloud Functions and later the static site. The developer asked for the CI/CD of their
flash-cards project to be copied as closely as possible: a reusable `ci.yml` on every pull request, a `deploy.yml`
on push to the default branch that runs CI first and then deploys with a Google Cloud service account, CodeQL,
Dependabot, actions pinned to commit SHAs, and the Firebase CLI run with `npx` at a pinned version.

## Decision

- Pull requests run CI in GitHub Actions; a push to `main` runs CI again and then deploys.
- **Cloud Functions** deploy automatically on every push to `main`.
- **The SQL Connect schema and connectors** deploy only when the deploy workflow is started by hand with its
  checkbox ticked, since a schema change can drop columns. The first deploy, which creates the Cloud SQL instance,
  is run once by the developer from their machine, because only the interactive CLI offers the free-trial instance.
- CI signs in to Google Cloud with a service-account JSON key in the `FIREBASE_SERVICE_ACCOUNT` repository secret,
  as flash-cards does, rather than Workload Identity Federation.
- The static site joins the automatic deploys when the static build exists; until then Vercel keeps serving the
  live site.

## Consequences

- A stored key can leak; its service account holds only the roles the deploy needs, and the key is rotated by
  replacing the secret.
- A schema change reaches production only when someone starts the deploy by hand.

## Sources

- `firebase.json`
- `dataconnect/dataconnect.yaml`
- `functions/package.json`
