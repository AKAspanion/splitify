---
type: Design Tokens
title: Design tokens
description: shadcn's zinc theme as HSL CSS variables in app/globals.css, mapped to Tailwind colours, plus a green 'sparkle' accent; light and dark by class.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Design tokens

## Colours

- Colours are CSS variables in `app/globals.css`, one set under `:root` (light) and one under `.dark`, in HSL; the
  base palette is shadcn's `zinc` (`components.json`).
- `tailwind.config.ts` maps them to Tailwind colours (`background`, `foreground`, `primary`, `secondary`, `muted`,
  `accent`, `destructive`, `card`, `popover`, `border`, `input`, `ring`).
- `sparkle` is this project's own accent, a green, used for positive amounts ("You get back", the `text-sparkle`
  class in `app/(platform)/(app)/_utils/expense.ts`); `destructive` is used for amounts owed.
- Dark mode is class-based (`darkMode: ["class"]`), switched by `next-themes` in `components/theme/provider.tsx`,
  following the system by default (`app/layout.tsx`).

## Spacing and radius

Tailwind's default spacing. Corner radius is `--radius` in `app/globals.css`, with `lg`, `md` and `sm` derived from
it in `tailwind.config.ts`.

## Typography

Inter, from `next/font/google`, set on `<body>` in `app/layout.tsx`.

## Sources

- `app/globals.css`
- `tailwind.config.ts`
- `components.json`
- `components/theme/provider.tsx`
- `app/layout.tsx`
- `app/(platform)/(app)/_utils/expense.ts`
