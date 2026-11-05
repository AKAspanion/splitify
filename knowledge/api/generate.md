---
type: API Contract
title: Reports API
description: The reports Cloud Function: one POST route that turns a group's expenses into an Excel workbook, a CSV or a text file, for the group's members only.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Reports API

The three `/api/generate/{excel,csv,text}/expense` route handlers are gone. One Cloud Function, `reports`
(`functions/src/reports/index.ts`, region `asia-south1`), replaces them; Hosting rewrites `/api/reports/**` to it
([Cloud Functions](../apps/functions.md)).

## Route

`POST /api/reports/expenses` with the JSON body `{ groupId, format }`, where `format` is `excel`, `csv` or `text`. The
browser calls it through `callFunction` (`lib/functions/call.ts`), which sends the Firebase ID token. The answer is a file
attachment named after the group:

- `excel`: an `.xlsx` with a logo, then one row per expense followed by a row per member who paid or owes on it, with
  `paid` and `owed` (`functions/src/reports/excel.ts`).
- `csv`: a real `.csv`: a header line (`Description,Amount,Category,Type`), then one line per expense, quoted where a cell
  needs it (`functions/src/reports/csv.ts`). The old `csv` route sent an `.xlsx` despite its path.
- `text`: the group's title, then the same header and lines, comma separated (`functions/src/reports/text.ts`).

The group screen's download button (`app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx`) offers all
three ([reports](../features/reports.md)).

## Rules

- The guard runs first: `401` without a valid ID token, `413` over 65536 bytes, `415` for a body that is not JSON, `400`
  for a body that cannot be read ([auth](../security/auth.md)).
- `405` for any method but POST; `400` for a missing `groupId` or an unknown format.
- `404` for a group that does not exist, an id that is not a UUID, and a group the caller is not a member of, all with the
  same answer; `404` "No expenses found" when the group has none. This closes
  [missing membership checks on reads](../findings/missing-group-membership-checks-on-reads.md).
- `500` "Something went wrong" otherwise, with the failing operation and the error's class in Cloud Logging.
- `Content-Disposition` carries a sanitised file name, so a group title cannot inject headers.
- It reads the ledger through the `admin` connector (`IsGroupMember`, `GetGroupLedgerAdmin`).

## History

- 2026-11-05: was three `POST /api/generate/*/expense` routes behind Clerk that checked no membership, with a csv route that sent an xlsx; now one function for members only, with a real csv and a title on the text file, because spec 2c moved the server's work into functions. See [static build decision](../decisions/static-build-on-firebase-hosting.md).

## Sources

- `functions/src/reports/index.ts`
- `functions/src/reports/excel.ts`
- `functions/src/reports/csv.ts`
- `functions/src/reports/text.ts`
- `app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx`
- `lib/functions/call.ts`
