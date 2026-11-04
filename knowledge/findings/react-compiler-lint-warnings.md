---
type: Finding
title: React Compiler lint rules flag four components
description: eslint-plugin-react-hooks 7 flags a synchronous setState inside an effect in three components and an impure call during render in scroll-to; the rules are set to warn until the code is changed.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T09:20:00Z
---

# React Compiler lint rules flag four components

## Finding

The dependency upgrade ([decision](../decisions/upgrade-all-dependencies.md)) brought `eslint-plugin-react-hooks` 7,
whose React Compiler rules `react-hooks/set-state-in-effect` and `react-hooks/purity` are errors in
`eslint-config-next/core-web-vitals`. The code they flag predates the upgrade. Fixing it means rewriting effects,
which changes behaviour, so `eslint.config.mjs` sets both rules to `warn` instead.

- `react-hooks/set-state-in-effect`: an effect sets state synchronously, which costs an extra render.
- `react-hooks/purity`: `performance.now()` is called in a function the rule counts as render.

## Evidence

- `app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx`: an effect resets the equal split when `users` changes.
- `app/(platform)/profile/notification-action.tsx`: an effect reads push-subscription state on mount.
- `components/biometric/biometric.tsx`: an effect starts verification when the path changes.
- `components/scroll-to.tsx`: `scrollTo` calls `performance.now()`.

## Status

Open. When each is fixed, set the rule in `eslint.config.mjs` back to the preset's level.

## Sources

- `eslint.config.mjs`
- `app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx`
- `app/(platform)/profile/notification-action.tsx`
- `components/biometric/biometric.tsx`
- `components/scroll-to.tsx`
