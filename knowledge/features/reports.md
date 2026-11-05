---
type: Feature
title: Reports
description: Download a group's expenses as an Excel workbook, a CSV or a text file from the group screen, for the group's members only.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Reports

## What it does

The group screen has a download control with three formats: an Excel report, with each expense followed by what each
member paid and owes; a CSV of the expenses; and a text file that starts with the group's title. The file is built by
the `reports` Cloud Function ([reports API](../api/generate.md)) and saved by the browser under the group's name.

## Screens and routes

- `app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx`, which posts `{ groupId, format }` to
  `POST /api/reports/expenses` through `callFunction`.

## Rules

- Members of the group only: a group that does not exist and one the caller isn't in answer the same `404`.
- A group with no expenses gets "No expenses found" (`404`).
- The CSV is a real CSV with a header line (the old csv route sent a workbook), and the file name is sanitised.

## Offline

Download report is online-only, disabled offline in the header popover ([decision](../decisions/offline-first-scope.md)).

## History

- 2026-11-05: had nothing about offline; now Download report is disabled offline, because the offline feature was built. See [offline](offline.md).
- 2026-11-05: was hidden on the hosted site, with Excel and text only; now back, with a real CSV, member-only access and a title on the text file, because spec 2c built the `reports` function. See [reports API](../api/generate.md).
- 2026-11-05: always shown; now hidden on the hosted site, because the report routes needed a server that spec 2c moves to Cloud Functions.

## Sources

- `app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx`
- `functions/src/reports/index.ts`
- `functions/src/reports/csv.ts`
- `functions/src/reports/text.ts`
- `functions/src/reports/excel.ts`
