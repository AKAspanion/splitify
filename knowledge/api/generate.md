---
type: API Contract
title: Report exports
description: Three POST routes that turn a group's expenses into an Excel, CSV-named Excel or plain-text download.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Report exports

## Routes

<!-- GA-GENERATED:routes app/api/generate -->

- `POST /api/generate/csv/expense`: `app/api/generate/csv/expense/route.ts`
- `POST /api/generate/excel/expense`: `app/api/generate/excel/expense/route.ts`
- `POST /api/generate/text/expense`: `app/api/generate/text/expense/route.ts`

<!-- GA-GENERATED:END -->

Each takes `{ groupId }` (`GenerateGroupReportBody` in `types/api.d.ts`) and returns a file as an attachment named
after the group:

- `POST /api/generate/excel/expense`: an `.xlsx` with one row per expense, followed by a row per member who paid or
  owes on it, with `paid` and `owed`. This is the one the group screen's download button uses
  (`app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx`), with `/api/generate/text/expense`. The hosted site hides that button until these routes are Cloud Functions (spec 2c).
- `POST /api/generate/csv/expense`: despite its path, an `.xlsx` of the expenses only (description, amount,
  category, type), on a sheet named `Group 1`.
- `POST /api/generate/text/expense`: a comma-separated `.txt` of the same four columns.

Workbooks are built by `generateXLS` in `lib/excel.ts`.

## Rules

- `401` without a session, `400` without `groupId`, `404` when the group has no expenses.
- None checks that the caller belongs to the group: see
  [missing membership checks on reads](../findings/missing-group-membership-checks-on-reads.md).

## History

- 2026-11-05: the group screen offered the download; now hidden on the hosted site, because spec 2b leaves reports to 2c.

## Sources

- `app/api/generate/excel/expense/route.ts`
- `app/api/generate/csv/expense/route.ts`
- `app/api/generate/text/expense/route.ts`
- `lib/excel.ts`
- `types/api.d.ts`
- `app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx`
