# Operations

<!-- GA-GENERATED:index -->

- [CI and deploy workflows](ci-cd.md) - What the GitHub Actions workflows check on pull requests and deploy on push to main, and which repository settings the deploy reads.
- [Deploy setup, done once](deploy-setup.md) - The one-time Google Cloud and GitHub steps before the deploy workflow and the budget kill switch work, and what is still unconfirmed about the deploy account's roles.
- [Environment](environment.md) - Every environment variable the app reads, listed in .env.sample, and where each is read.
- [Logging](logging.md) - APILogger writes to the console by default and to the Log table when ENABLE_DB_LOGGING is YES; Prisma query logging is a separate switch.
- [Run locally](run-locally.md) - Start MySQL with Docker, fill in .env, install with yarn (which pushes the schema), and run the Next.js dev server.

<!-- GA-GENERATED:END -->
