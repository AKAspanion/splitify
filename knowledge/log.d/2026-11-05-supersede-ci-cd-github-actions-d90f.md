---
type: Log Entry
date: 2026-11-05
at: "2026-11-05T00:58:08.055+05:30"
kind: Update
op: supersede
old: decisions/ci-cd-github-actions
new: decisions/ci-cd-functions-deployed-by-hand
previous_status: draft
appended: null
by: human:ankitp@geekyants.com
agent: claude-code
---
`decisions/ci-cd-github-actions` superseded by `decisions/ci-cd-functions-deployed-by-hand`: Cloud Functions now deploy by hand from a project owner's machine, because the CI service account can't grant the IAM roles a functions deploy needs
