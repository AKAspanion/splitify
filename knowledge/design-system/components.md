---
type: Component Inventory
title: Components
description: shadcn/ui primitives in components/ui, and the app's shared form, container and feedback components in components/.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Components

## Components

- **Primitives:** `components/ui/`, generated with shadcn (`components.json`, aliases `@/components` and
  `@/lib/utils`) on Radix UI. Add new ones the same way, rather than writing them by hand. Drawers use `vaul`
  (`components/ui/drawer.tsx`) and toasts `sonner` (`components/ui/sonner.tsx`).
- **Forms:** `components/form/`: `form-input.tsx`, `form-submit.tsx`, `form-errors.tsx` (shows an action's
  `fieldErrors`), and loading states.
- **Layout:** `components/container/auto-container.tsx` and `header.tsx` (a page header with a back link, which only follows a same-site path through `safeNextPath`; `backHref` gives a page's own fallback).
- **Confirm dialog:** `components/confirm/`, used through `useConfirm` before destructive actions.
- **Other shared pieces:** `components/no-data.tsx`, `components/list-item.tsx`, `components/logo.tsx`,
  `components/ui-spinner.tsx`, `components/theme/dark-mode-toggle.tsx`.
- **App-level pieces:** cards, navigation bars, skeletons and the add-expense button in
  `app/(platform)/(app)/_components/`.

## History

- 2026-11-06: the header's back link followed any `back` value; now it follows only a same-site path, and `Logo` can render a plain anchor (`fullPageLoad`), because of the security review and [the AdSense decision](../decisions/adsense-on-public-pages-only.md).

## Sources

- `components.json`
- `components/ui/drawer.tsx`
- `components/ui/sonner.tsx`
- `components/form/form-input.tsx`
- `components/form/form-submit.tsx`
- `components/form/form-errors.tsx`
- `components/container/auto-container.tsx`
- `components/container/header.tsx`
- `components/confirm/useConfirm.ts`
- `components/no-data.tsx`
- `components/list-item.tsx`
- `components/logo.tsx`
- `components/ui-spinner.tsx`
- `components/theme/dark-mode-toggle.tsx`
