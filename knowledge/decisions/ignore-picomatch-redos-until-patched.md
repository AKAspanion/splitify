---
type: Decision
title: Ignore the picomatch ReDoS advisory until a patched release ships
description: pnpm's audit ignores GHSA-fc5q-39xc-vjpf, because no patched picomatch is published and picomatch reaches only the dev tooling; the ignore comes out once picomatch 4.0.8 can be installed.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-18T05:10:00Z
stated: "Ignore the picomatch advisory in pnpm's audit config until a patched release ships? — Yes, ignore it for now"
stated_via: qa
status: draft
---

# Ignore the picomatch ReDoS advisory until a patched release ships

## Context

On 2026-11-18 a high-severity advisory, `GHSA-fc5q-39xc-vjpf` (a ReDoS through single-branch repeated extglobs),
flagged every picomatch release up to `4.0.7`, which covers both versions in the lockfile (2.x and 4.x). Its patched
version, `4.0.8`, isn't published: npm's latest picomatch was still `4.0.7`. CI's `pnpm audit --audit-level moderate`
step failed on it, on every branch and on `main`'s Deploy workflow, and no override could fix it, since there was no
version to move to. picomatch reaches only the dev tooling (ESLint's config and import resolver, the glob and file-watch
libraries): `pnpm audit --prod` found no vulnerabilities, so the shipped app doesn't contain it.

## Decision

- `pnpm-workspace.yaml`'s `auditConfig.ignoreGhsas` lists `GHSA-fc5q-39xc-vjpf`, and only it: any other advisory
  still fails the audit.
- Once picomatch `4.0.8` is published, remove the ignore and add a scoped override instead,
  `'picomatch@<4.0.8': ^4.0.8`, in the same `overrides` block as the minimatch and glob ones. No 2.x or 3.x release is
  patched, so micromatch, anymatch and readdirp move to 4.x.

## Consequences

- A malicious glob pattern given to the dev tooling could still hang it until the ignore comes out. The tooling only
  reads the repository's own patterns.
- CI's audit passes again, so pull requests and `main`'s deploys aren't blocked.

## Sources

- `pnpm-workspace.yaml`
- `.github/workflows/ci.yml`
- `pnpm-lock.yaml`
