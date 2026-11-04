# API

<!-- GA-GENERATED:index -->

- [App API](app.md) - Read-only JSON route handlers under /api/app that the client's react-query hooks call for groups, expenses and shares.
- [Report exports](generate.md) - Three POST routes that turn a group's expenses into an Excel, CSV-named Excel or plain-text download.
- [Push-notification API (removed)](push-notification.md) - The /api/push-notification routes the browser called after each write are gone; the server actions now record activity and send pushes themselves.
- [Server actions](server-actions.md) - Every write in Splitify is a Next.js server action in actions/, validated by zod through createSafeAction and checked for a Clerk session.
- [WebAuthn API](webauthn.md) - Routes that register a person's passkey devices and check one, used by the biometric lock.

<!-- GA-GENERATED:END -->
