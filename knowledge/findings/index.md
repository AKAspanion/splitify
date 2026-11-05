# Findings

<!-- GA-GENERATED:index -->

- [Any member can add a signed-up person to their group without asking](add-to-group-without-consent.md) - AddFriend with a group adds anyone found by email to the caller's group, skipping AddGroupMember's friends-only rule; the person gets a push with the group's title, and the group sees their email.
- [Fixed: the admin logs page was open to every signed-in user](admin-logs-unprotected.md) - The /logs page listed every Log row, including logged request bodies, to anyone with a session; the page and the Log table were removed.
- [Fixed: the Clerk webhook wasn't verified](clerk-webhook-unverified.md) - POST /api/webhook/clerk trusted any request body, so anyone could create users or overwrite a user's email, name and images; the webhook and Clerk were removed.
- [Firebase config for iOS is committed](committed-firebase-config.md) - packages/ios/src/Splitify/GoogleService-Info.plist, which holds the iOS app's Firebase API key and project ids, is tracked in git.
- [Fixed: a contact who signed up kept the contact's id](contact-signup-keeps-contact-id.md) - When a contact signed up, Clerk's webhook kept the spuser_ id on their row, while their session carried Clerk's id, so the app couldn't find them; the merge function now moves the contact's rows to the Firebase uid.
- [The Hosting emulator's CSP may block Google sign-in locally](emulator-csp-blocks-auth-iframe.md) - firebase.emulators.json's Content-Security-Policy frame-src has neither 'self' nor the Auth emulator's origin, so Google sign-in through the Hosting emulator is unchecked and may be blocked.
- [A Google sign-in can stay signed in with no User row if sign-out also fails](google-sign-in-signout-failure-keeps-session.md) - When UpsertMe fails after a Google redirect and Firebase Auth's sign-out then fails too, the session stays, and the sign-in form sends the person into the app without their User row.
- [Fixed: the session password was hard-coded](hardcoded-session-password.md) - The iron-session password that sealed the WebAuthn challenge cookie was a literal in four route files, so it was in git history; the webauthn function reads it from the SESSION_PASSWORD secret.
- [Fixed: writes didn't check who may change what](missing-authorization-on-writes.md) - Any signed-in person could update or delete any group or expense, add anyone to any group, rename any user and record expenses as someone else; SQL Connect's operations now check membership.
- [Fixed: group reads didn't check membership](missing-group-membership-checks-on-reads.md) - Several read routes and actions only checked for a session, so any signed-in person could read any group's expenses, members, shares and reports by id; SQL Connect's queries and the reports function now check membership.
- [Offline gaps that were left open or not checked](offline-gaps-unchecked.md) - A connection that is up but carries no data still shows a load error over saved data; the update toast, push through the merged worker and a clean test:rules run were not confirmed.
- [Fixed: push-notification routes were an open relay](push-notification-open-relay.md) - Any signed-in person could push any text to any user, and forge activity entries in any group under another person's name; pushes are now sent by Cloud Functions triggers that take nothing from a request.
- [React Compiler lint rules flag six components](react-compiler-lint-warnings.md) - eslint-plugin-react-hooks 7 flags a synchronous setState inside an effect in five components and an impure call during render in scroll-to; the rules are set to warn until the code is changed.
- [Functions triggered by SQL Connect mutations don't run in the local emulator](sql-connect-triggers-not-run-locally.md) - mergeContactOnSignUp and the three push senders never load in the Functions emulator, so locally signing up merges no contact and sends no push.
- [Fixed: the WebAuthn counter wasn't saved](webauthn-counter-not-saved.md) - After a successful check the authenticator's new signature counter was set on an in-memory copy and never written back; the webauthn function now saves it.

<!-- GA-GENERATED:END -->
