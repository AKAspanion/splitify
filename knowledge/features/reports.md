---
type: Feature
title: Reports
description: Download a group's expenses as an Excel workbook or a text file from the group screen.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Reports

## What it does

The group screen has a download control offering an Excel report, with each expense followed by what each member
paid and owes, or a plain-text list of the expenses.

## Screens and routes

- `app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx`, which posts to
  `POST /api/generate/excel/expense` or `POST /api/generate/text/expense` ([report exports](../api/generate.md)).

## Rules

- A group with no expenses gets "No expenses found" (`404`).

## Sources

- `app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx`
- `app/api/generate/excel/expense/route.ts`
- `app/api/generate/text/expense/route.ts`
