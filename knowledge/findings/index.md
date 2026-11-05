# Findings

<!-- GA-GENERATED:index -->

- [Fixed: the admin logs page was open to every signed-in user](admin-logs-unprotected.md) - The /logs page listed every Log row, including logged request bodies, to anyone with a session; the page and the Log table were removed.
- [Fixed: the Clerk webhook wasn't verified](clerk-webhook-unverified.md) - POST /api/webhook/clerk trusted any request body, so anyone could create users or overwrite a user's email, name and images; the webhook and Clerk were removed.
- [Firebase config for iOS is committed](committed-firebase-config.md) - packages/ios/src/Splitify/GoogleService-Info.plist, which holds the iOS app's Firebase API key and project ids, is tracked in git.
- [Fixed: a contact who signed up kept the contact's id](contact-signup-keeps-contact-id.md) - When a contact signed up, Clerk's webhook kept the spuser_ id on their row, while their session carried Clerk's id, so the app couldn't find them; the merge function now moves the contact's rows to the Firebase uid.
- [Fixed: the session password was hard-coded](hardcoded-session-password.md) - The iron-session password that sealed the WebAuthn challenge cookie was a literal in four route files, so it was in git history; the webauthn function reads it from the SESSION_PASSWORD secret.
- [Fixed: writes didn't check who may change what](missing-authorization-on-writes.md) - Any signed-in person could update or delete any group or expense, add anyone to any group, rename any user and record expenses as someone else; SQL Connect's operations now check membership.
- [Fixed: group reads didn't check membership](missing-group-membership-checks-on-reads.md) - Several read routes and actions only checked for a session, so any signed-in person could read any group's expenses, members, shares and reports by id; SQL Connect's queries and the reports function now check membership.
- [Offline gaps that were left open or not checked](offline-gaps-unchecked.md) - A connection that is up but carries no data still shows a load error over saved data; the update toast, push through the merged worker and a clean test:rules run were not confirmed.
- [Fixed: push-notification routes were an open relay](push-notification-open-relay.md) - Any signed-in person could push any text to any user, and forge activity entries in any group under another person's name; pushes are now sent by Cloud Functions triggers that take nothing from a request.
- [React Compiler lint rules flag four components](react-compiler-lint-warnings.md) - eslint-plugin-react-hooks 7 flags a synchronous setState inside an effect in three components and an impure call during render in scroll-to; the rules are set to warn until the code is changed.
- [Fixed: the WebAuthn counter wasn't saved](webauthn-counter-not-saved.md) - After a successful check the authenticator's new signature counter was set on an in-memory copy and never written back; the webauthn function now saves it.

<!-- GA-GENERATED:END -->
