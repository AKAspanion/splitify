---
type: Log Entry
date: 2026-11-05
at: "2026-11-05T18:16:21.630+05:30"
kind: Update
by: human:ankitp@geekyants.com
agent: claude-code
---
Confirmed decisions/contacts-editable-only-by-their-friends: reviewed by human:ankitp@geekyants.com. Stated via qa: Security audit, High: any group-mate can befriend a contact someone else created, change its email to their own, and the merge moves the contact's groups to them. How should the fix close it? (Block both: AddFriend refuses a contact unless you're already its friend, UpdateContact refuses an email in use) — “Block both (Recommended)”
