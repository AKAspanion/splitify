---
type: Finding
title: "Fixed: React Compiler lint rules flagged six components"
description: eslint-plugin-react-hooks 7 flagged a synchronous setState inside an effect in five components and an impure call during render in scroll-to; all are rewritten and the rules are back at the preset's level.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T09:20:00Z
verified: human:ankitp@geekyants.com
---

# Fixed: React Compiler lint rules flagged six components

## Finding

The dependency upgrade ([decision](../decisions/upgrade-all-dependencies.md)) brought `eslint-plugin-react-hooks` 7,
whose React Compiler rules `react-hooks/set-state-in-effect` and `react-hooks/purity` are errors in
`eslint-config-next/core-web-vitals`. The code they flagged predated the upgrade, and `eslint.config.mjs` set both
rules to `warn` while it stayed.

- `react-hooks/set-state-in-effect`: an effect sets state synchronously, which costs an extra render.
- `react-hooks/purity`: `performance.now()` is called in a function the rule counts as render.

## Evidence

Each was flagged in:

- `app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx`: an effect reset the equal split when `users` changed.
- `app/(platform)/profile/notification-action.tsx`: an effect read notification-permission state on mount.
- `components/biometric/biometric.tsx`: an effect started verification when the path changed.
- `app/(platform)/(auth)/sign-in/sign-in-form.tsx` and `sign-up/sign-up-form.tsx`: the forms' mount effects set
  `pending` to finish a Google redirect.
- `components/scroll-to.tsx`: `scrollTo` called `performance.now()`.
- `components/auth/auth-provider.tsx`: set the signed-out state in an effect when Firebase Auth can't start (found
  later, fixed in eb17663).

## Status

Fixed. Every component is rewritten and `eslint.config.mjs` no longer overrides either rule, so both are at the
preset's level.

## Sources

- `eslint.config.mjs`
- `app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx`
- `app/(platform)/profile/notification-action.tsx`
- `components/biometric/biometric.tsx`
- `components/scroll-to.tsx`
- `components/auth/auth-provider.tsx`
- `app/(platform)/(auth)/sign-in/sign-in-form.tsx`
- `app/(platform)/(auth)/sign-up/sign-up-form.tsx`
