---
type: Runbook
title: CI and deploy workflows
description: What the GitHub Actions workflows check on pull requests and deploy on push to main, and which repository settings the deploy reads.
status: draft
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-04T18:30:00Z
---

# CI and deploy workflows

The reasons are in [the decision](../decisions/ci-cd-github-actions.md); the one-time console steps are in
[deploy setup](deploy-setup.md). The files in `.github/` hold the exact commands, versions and pinned action SHAs.

## What runs, and when

- `.github/workflows/ci.yml`: on every pull request, and callable by `deploy.yml` (`workflow_call`). One job installs
  with `--ignore-scripts` (so `postinstall` never runs `prisma db push` in CI), then runs lint, type check, unit tests,
  the SQL Connect rule tests, the root and `functions/` audits, and the functions build. Node comes from `.nvmrc`.
- `.github/workflows/codeql.yml`: CodeQL on pull requests, on pushes to `main` and weekly, for the code and for the
  workflows themselves.
- `.github/dependabot.yml`: weekly grouped minor and patch updates for the root, `functions/` and GitHub Actions;
  major bumps of TypeScript, `@types/node` and Prisma are ignored.
- `.github/workflows/deploy.yml`: on push to `main`, runs CI and then deploys the Cloud Functions. Started by hand with
  `deploy_dataconnect` ticked, it also deploys the SQL Connect schema and connectors. It runs one at a time
  (`concurrency: deploy-production`, never cancelled), checks its settings first and fails naming the missing ones, and
  removes the service-account key file in a step that always runs.

## The audits fail only on high or critical

Yarn 1's `audit` exits with a bitmask of every severity found, whatever `--level` says, so a moderate advisory alone
exits non-zero. Both audit steps in `ci.yml` therefore fail only when the high (`8`) or critical (`16`) bit is set.
Moderate advisories never fail CI; Dependabot still reports them.

## Repository settings the deploy reads

- Secret `FIREBASE_SERVICE_ACCOUNT`: the JSON key of the `github-deploy@` service account.
- Variable `FIREBASE_PROJECT_ID`: the Google Cloud project.
- Optional variable APP_URL: shown on the `production` environment; defaults to `https://splitify.spanion.in`.

## Sources

- `.github/workflows/ci.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/deploy.yml`
- `.github/dependabot.yml`
- `README.md`
