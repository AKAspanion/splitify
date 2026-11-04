# Decisions

<!-- GA-GENERATED:index -->

- [Continue the Splitify codebase in place](continue-splitify-codebase.md) - This repository's own Next.js and Prisma code is built on where it is, keeping its structure; it is not rewritten or migrated.
- [Upgrade every dependency to its latest version at once](upgrade-all-dependencies.md) - All packages, including the framework majors (Next, React, Clerk, Prisma, Tailwind, ESLint), move to their latest release on one branch; a package not yet compatible with the rest stays on its newest compatible release.

<!-- GA-GENERATED:END -->
