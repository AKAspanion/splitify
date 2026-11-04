# Decisions

<!-- GA-GENERATED:index -->

- [Server actions record activity and send notifications themselves](activity-and-notifications-in-actions.md) - Each server action writes its activity entry and sends its push notifications on the server after its change succeeds; the /api/push-notification routes and the browser's NotificationService calls are removed.
- [Deleting an account anonymises the person, keeping shared expenses](anonymise-deleted-accounts.md) - When someone deletes their account, their user row stays so the groups they shared still add up, but everything that identifies them is removed; their expenses, payments and splits are kept.
- [Continue the Splitify codebase in place](continue-splitify-codebase.md) - This repository's own Next.js and Prisma code is built on where it is, keeping its structure; it is not rewritten or migrated.
- [Changes are tested with end-to-end tests of the main flows](e2e-main-flows.md) - The project's testing is end-to-end tests that walk the main flows as a person would; which runner, and which flows count as main, aren't settled yet.
- [Editing an expense changes only its description](expense-edit-description-only.md) - An expense's description is the only thing that can be edited; amounts, payers, splits and category are corrected by deleting the expense and adding it again.
- [Any group member may change the group and its expenses; contacts only by their friends](group-member-permissions.md) - Every member of a group may edit or delete it, change its members, and edit or delete its expenses; non-members can neither read nor change it. A contact is edited only by someone who has them as a friend, and a Clerk user by nobody else.
- [Keep splitify.spanion.in as the apps' domain](keep-splitify-spanion-domain.md) - The Android TWA and the iOS wrapper keep opening splitify.spanion.in; when its DNS record went missing, the record was restored at the spanion.in DNS provider rather than the apps moving to a new host.
- [Currencies per group and per expense, converted at the group's creation-date rate](multi-currency.md) - A group has its own currency and each expense can have its own; an expense in another currency is converted at the exchange rate of the day the group was created, which never changes afterwards.
- [Delete the /logs admin page instead of adding an admin role](remove-admin-logs-page.md) - The /logs page, which showed every Log row to any signed-in user, is removed; the app keeps no admin role and logs are read from the database directly.
- [Keep the iOS Firebase config out of git](untrack-ios-firebase-config.md) - packages/ios/src/Splitify/GoogleService-Info.plist is untracked and gitignored; a sample with placeholder values is committed beside it, and each developer drops in the real file from the Firebase console.
- [Upgrade every dependency to its latest version at once](upgrade-all-dependencies.md) - All packages, including the framework majors (Next, React, Clerk, Prisma, Tailwind, ESLint), move to their latest release on one branch; a package not yet compatible with the rest stays on its newest compatible release.

<!-- GA-GENERATED:END -->
