# API

<!-- GA-GENERATED:index -->

- [App API (removed)](app.md) - The read-only /api/app route handlers are gone; the screens read through SQL Connect queries in lib/data/.
- [Reports API](generate.md) - The reports Cloud Function: one POST route that turns a group's expenses into an Excel workbook, a CSV or a text file, for the group's members only.
- [Push-notification API (removed)](push-notification.md) - There is no push-notification route; Cloud Functions triggers send each change's push through FCM.
- [Server actions (removed)](server-actions.md) - The Next.js server actions are gone; every write is a SQL Connect mutation run from a lib/data/ hook.
- [WebAuthn API](webauthn.md) - The webauthn Cloud Function: six routes that register a person's passkey devices and check one, used by the biometric lock.

<!-- GA-GENERATED:END -->
