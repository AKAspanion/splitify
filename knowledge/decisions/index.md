# Decisions

<!-- GA-GENERATED:index -->

- [Server actions record activity and send notifications themselves](activity-and-notifications-in-actions.md) - Each server action writes its activity entry and sends its push notifications on the server after its change succeeds; the /api/push-notification routes and the browser's NotificationService calls are removed.
- [Log to Cloud Logging instead of a Log table](cloud-logging.md) - The Log table and APILogger's database logging are dropped; Cloud Functions write structured logs to Cloud Logging, which is where logs are read.
- [Continue the Splitify codebase in place](continue-splitify-codebase.md) - This repository's own Next.js code is built on where it is, keeping its structure; it is not rewritten. Its data layer moves from Prisma to SQL Connect.
- [Sign people in with Firebase Auth, by Google or email and password](firebase-auth.md) - Firebase Auth replaces Clerk; people sign in with Google or with email and password, a user's row is written from their verified token, and a contact becomes a signed-up user only once that email is verified.
- [Any group member may change the group and its expenses; contacts only by their friends](group-member-permissions.md) - Every member of a group may edit or delete it, change its members, and edit or delete its expenses; non-members can neither read nor change it. A contact is edited only by someone who has them as a friend, and a Clerk user by nobody else.
- [Offline, people can read everything and add expenses and settlements](offline-first-scope.md) - The PWA shows groups, expenses and balances from a cache saved in the browser, and queues new expenses and settlements made offline until the connection returns; other changes need a connection.
- [Delete the /logs admin page instead of adding an admin role](remove-admin-logs-page.md) - The /logs page, which showed every Log row to any signed-in user, is removed; the app keeps no admin role, and logs are read in Cloud Logging.
- [Store data in Firebase SQL Connect in asia-south1](sql-connect-database.md) - Prisma over MySQL is replaced by Firebase SQL Connect (Cloud SQL for PostgreSQL) in GCP project splitify-416321, region asia-south1, starting with an empty database; its access rules read Firebase Auth.
- [Serve a static build from Firebase Hosting, with Cloud Functions for the server routes](static-build-on-firebase-hosting.md) - The Next.js app is built with output export and served from Firebase Hosting with no server rendering; the few routes that need a server run as Cloud Functions under /api on the same domain.
- [Keep the iOS Firebase config out of git](untrack-ios-firebase-config.md) - packages/ios/src/Splitify/GoogleService-Info.plist is untracked and gitignored; a sample with placeholder values is committed beside it, and each developer drops in the real file from the Firebase console.
- [Upgrade every dependency to its latest version at once](upgrade-all-dependencies.md) - All packages, including the framework majors (Next, React, Clerk, Prisma, Tailwind, ESLint), move to their latest release on one branch; a package not yet compatible with the rest stays on its newest compatible release.

<!-- GA-GENERATED:END -->
