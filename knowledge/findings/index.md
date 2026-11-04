# Findings

<!-- GA-GENERATED:index -->

- [Admin logs page is open to every signed-in user](admin-logs-unprotected.md) - /logs lists every Log row, including logged request bodies, to anyone with a Clerk session.
- [Fixed: Clerk webhook wasn't verified](clerk-webhook-unverified.md) - POST /api/webhook/clerk trusted any request body, so anyone could create users or overwrite a user's email, name and images; it now checks Clerk's signature.
- [Firebase config for iOS is committed](committed-firebase-config.md) - packages/ios/src/Splitify/GoogleService-Info.plist, which holds the iOS app's Firebase API key and project ids, is tracked in git.
- [A contact who signs up keeps the contact's id](contact-signup-keeps-contact-id.md) - When a contact signs up, Clerk's webhook keeps the spuser_ id on their row, while their session carries Clerk's id, so the app can't find them by session.
- [Session password is hard-coded](hardcoded-session-password.md) - The iron-session password that seals the WebAuthn challenge cookie is written as a literal in four route files, so it is in git history.
- [Writes don't check who may change what](missing-authorization-on-writes.md) - Any signed-in person can update or delete any group or expense, add anyone to any group, rename any user, and record expenses as someone else.
- [Group reads don't check membership](missing-group-membership-checks-on-reads.md) - Several read routes and actions only check for a session, so any signed-in person can read any group's expenses, members, shares and reports by id.
- [Push-notification routes are an open relay](push-notification-open-relay.md) - Any signed-in person can push any text to any user, and forge activity entries in any group under another person's name.
- [React Compiler lint rules flag four components](react-compiler-lint-warnings.md) - eslint-plugin-react-hooks 7 flags a synchronous setState inside an effect in three components and an impure call during render in scroll-to; the rules are set to warn until the code is changed.
- [WebAuthn counter isn't saved](webauthn-counter-not-saved.md) - After a successful check the authenticator's new signature counter is set on an in-memory copy and never written back, so cloned authenticators aren't detected.

<!-- GA-GENERATED:END -->
