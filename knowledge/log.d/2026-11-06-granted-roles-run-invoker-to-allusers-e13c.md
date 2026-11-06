---
type: Log Entry
date: 2026-11-06
at: "2026-11-06T12:37:22.521+05:30"
kind: Fix
by: human:ankitp@geekyants.com
agent: claude-code
---
Granted roles/run.invoker to allUsers on the deletemyaccount, webauthn and reports Cloud Run services: their IAM policies were empty, so Google answered 403 before any code ran, which broke account deletion, passkey registration and reports
