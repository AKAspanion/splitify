---
type: Decision
title: Stay on Node 24 while Cloud Functions' Node 26 is a preview
description: The app, CI and Cloud Functions stay on Node 24 although Node 26 is LTS, because nodejs26 is preview-only on Cloud Run functions and firebase-tools rejects it at deploy.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-05T12:45:35Z
---

# Stay on Node 24 while Cloud Functions' Node 26 is a preview

## Context

On 2026-11-05 Node 26 was the newest LTS line. The repository runs one Node major everywhere: `.nvmrc` for local work
and CI, `engines.node` in `functions/package.json`, and `runtime` in `firebase.json` for the deployed functions.
Google's runtime support page listed `nodejs26` as Preview. firebase-tools 15.34.x refused it at deploy ("Detected node
engine 26 in package.json, which is not a supported version", firebase-tools issue #11393), and support was an open
pull request (#11411).

## Decision

Everything stays on Node 24, including `@types/node`, which follows the runtime
([upgrade every dependency](upgrade-all-dependencies.md)). Move to 26 once `nodejs26` is GA on Cloud Run functions and
the pinned firebase-tools accepts it, all three places in one change.

## Consequences

- Node 24 is in maintenance LTS, with security fixes until April 2028.
- Dependabot keeps ignoring `@types/node` majors (`.github/dependabot.yml`).

## Assumed

Claude made this ruling while planning the 2026-11-05 modernization, from the sources above. Running the site on 26
and the functions on 24 was rejected so that one version stays everywhere. The developer hasn't confirmed it.

## Sources

- `.nvmrc`
- `functions/package.json`
- `firebase.json`
- `.github/dependabot.yml`
