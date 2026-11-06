---
type: Finding
title: Button with asChild throws because it gives Radix Slot two children
description: components/ui/button.tsx passes two children to Radix Slot when asChild is set, and Slot accepts one, so any use of asChild fails at render.
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-06T09:00:00Z
---

# Button with asChild throws because it gives Radix Slot two children

## Finding

`Button` in `components/ui/button.tsx` renders more than one child inside Radix `Slot` when `asChild` is set, and `Slot`
accepts a single child element, so a `Button asChild` throws when it renders. Nothing in the app uses `asChild` on
`Button` today (the payment drawer's nested button was fixed another way, see [debt](../risks/debt.md)), so it is a
trap for the next use rather than a live failure.

## Evidence

Reported by the web fix wave of `docs/plans/2026-11-05-repo-modernization.md` and deferred as Minor in the run's ledger.

## Status

Open.

## Sources

- `components/ui/button.tsx`
